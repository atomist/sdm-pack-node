/*
 * Copyright © 2019 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    GitProject,
    Project,
    RemoteRepoRef,
} from "@atomist/automation-client";
import {
    AppInfo,
    ExecuteGoalResult,
    GoalInvocation,
    GoalProjectListenerEvent,
    GoalProjectListenerRegistration,
    LoggingProgressLog,
    spawnLog,
    SpawnLogCommand,
    SpawnLogResult,
    SuccessIsReturn0ErrorFinder,
} from "@atomist/sdm";
import { readSdmVersion } from "@atomist/sdm-core";
import {
    Builder,
    spawnBuilder,
    SpawnBuilderOptions,
} from "@atomist/sdm-pack-build";
import * as fs from "fs-extra";
import * as _ from "lodash";
import { IsNode } from "../pushtest/nodePushTests";
import { NpmLogInterpreter } from "./npmLogInterpreter";

/**
 * Options to use when running node commands like npm run compile that require dev dependencies to be installed
 */
export const DevelopmentEnvOptions = {
    env: {
        ...process.env,
        NODE_ENV: "development",
    },
    log: new LoggingProgressLog("npm"),
};

export const Install: SpawnLogCommand = { command: "npm", args: ["ci"], options: DevelopmentEnvOptions };

export function nodeBuilder(...commands: SpawnLogCommand[]): Builder {
    return spawnBuilder(npmBuilderOptions(commands.map(cmd => ({
        command: cmd.command, args: cmd.args, options: {
            ...DevelopmentEnvOptions,
            ...cmd.options,
        },
    }))));
}

function npmBuilderOptions(commands: SpawnLogCommand[]): SpawnBuilderOptions {
    return {
        name: "NpmBuilder",
        commands,
        errorFinder: SuccessIsReturn0ErrorFinder,
        logInterpreter: NpmLogInterpreter,
        async projectToAppInfo(p: Project): Promise<AppInfo> {
            const packageJson = await p.findFile("package.json");
            const content = await packageJson.getContent();
            const pkg = JSON.parse(content);
            return { id: p.id as RemoteRepoRef, name: pkg.name, version: pkg.version };
        },
    };
}

export function npmBuilderOptionsFromFile(commandFile: string): SpawnBuilderOptions {
    return {
        name: "NpmBuilder",
        commandFile,
        errorFinder: (code, signal, l) => {
            return l.log.startsWith("[error]") || l.log.includes("ERR!");
        },
        logInterpreter: NpmLogInterpreter,
        async projectToAppInfo(p: Project): Promise<AppInfo> {
            const packageJson = await p.findFile("package.json");
            const content = await packageJson.getContent();
            const pkg = JSON.parse(content);
            return { id: p.id as RemoteRepoRef, name: pkg.name, version: pkg.version };
        },
    };
}

export const NpmPreparations = [npmInstallPreparation, npmVersionPreparation, npmCompilePreparation];

export async function npmInstallPreparation(p: GitProject, goalInvocation: GoalInvocation): Promise<ExecuteGoalResult> {
    const hasPackageLock = p.fileExistsSync("package-lock.json");
    return spawnLog(
        "npm",
        [hasPackageLock ? "ci" : "install"],
        {
            cwd: p.baseDir,
            ...DevelopmentEnvOptions,
            log: goalInvocation.progressLog,
        });
}

export async function npmVersionPreparation(p: GitProject, goalInvocation: GoalInvocation): Promise<ExecuteGoalResult> {
    const sdmGoal = goalInvocation.goalEvent;
    const version = await readSdmVersion(
        sdmGoal.repo.owner,
        sdmGoal.repo.name,
        sdmGoal.repo.providerId,
        sdmGoal.sha,
        sdmGoal.branch,
        goalInvocation.context);
    return spawnLog(
        "npm",
        ["--no-git-tag-version", "version", version],
        {
            cwd: p.baseDir,
            log: goalInvocation.progressLog,
        });
}

export const NpmVersionProjectListener: GoalProjectListenerRegistration = {
    name: "npm version",
    pushTest: IsNode,
    listener: async (p, r, event): Promise<void | ExecuteGoalResult> => {
        if (GoalProjectListenerEvent.before === event) {
            return npmVersionPreparation(p, r);
        }
    },
};

export async function npmCompilePreparation(p: GitProject, goalInvocation: GoalInvocation): Promise<ExecuteGoalResult> {
    return spawnLog(
        "npm",
        ["run", "compile"],
        {
            cwd: p.baseDir,
            ...DevelopmentEnvOptions,
            log: goalInvocation.progressLog,
        });
}

export const NpmCompileProjectListener: GoalProjectListenerRegistration = {
    name: "npm compile",
    pushTest: IsNode,
    listener: async (p, r): Promise<void | ExecuteGoalResult> => {
        return npmCompilePreparation(p, r);
    },
    events: [GoalProjectListenerEvent.before],
};

export const NodeModulesProjectListener: GoalProjectListenerRegistration = {
    name: "npm install",
    listener: async (p, gi) => {
        // Check if project has a package.json
        if (!(await p.hasFile("package.json"))) {
            return;
        }
        return cacheNodeModules(p, gi);
    },
    events: [GoalProjectListenerEvent.before],
    pushTest: IsNode,
};

async function cacheNodeModules(p: GitProject, gi: GoalInvocation): Promise<void | ExecuteGoalResult> {
    // If project already has a node_modules dir; there is nothing left to do
    if (await p.hasDirectory("node_modules")) {
        return;
    }

    let requiresInstall = true;
    let installed = false;

    // Check cache for a previously cached node_modules cache archive
    const cacheFileName = `${_.get(gi, "configuration.sdm.cache.path",
        "/opt/data")}/${gi.goalEvent.goalSetId}-node_modules.tar.gz`;
    if (_.get(gi, "configuration.sdm.cache.enabled") === true && (await fs.pathExists(cacheFileName))) {
        const result = await extract(cacheFileName, p, gi);
        requiresInstall = result.code !== 0;
    }

    if (requiresInstall) {
        let result;
        if (await p.hasFile("package-lock.json")) {
            result = await runInstall("ci", p, gi);
        } else {
            result = await runInstall("i", p, gi);
        }
        installed = result.code === 0;
    }

    // Cache the node_modules folder
    if (installed && _.get(gi, "configuration.sdm.cache.enabled") === true) {
        const tempCacheFileName = `${cacheFileName}.${process.pid}`;
        const result = await compress(tempCacheFileName, p, gi);
        if (result.code === 0) {
            await fs.move(tempCacheFileName, cacheFileName, { overwrite: true });
        }
    }
}

async function runInstall(cmd: string,
                          p: GitProject,
                          gi: GoalInvocation): Promise<SpawnLogResult> {
    return spawnLog(
        "npm",
        [cmd],
        {
            cwd: p.baseDir,
            env: {
                ...process.env,
                NODE_ENV: "development",
            },
            log: gi.progressLog,
        });
}

async function compress(name: string,
                        p: GitProject,
                        gi: GoalInvocation): Promise<SpawnLogResult> {
    return spawnLog(
        "tar",
        ["-zcf", name, "node_modules"],
        {
            cwd: p.baseDir,
            log: gi.progressLog,
        });
}

async function extract(name: string,
                       p: GitProject,
                       gi: GoalInvocation): Promise<SpawnLogResult> {
    return spawnLog(
        "tar",
        ["-xf", name],
        {
            cwd: p.baseDir,
            log: gi.progressLog,
        });
}
