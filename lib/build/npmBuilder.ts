/*
 * Copyright © 2018 Atomist, Inc.
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
    asSpawnCommand,
    ChildProcessResult,
    GitProject,
    Project,
    RemoteRepoRef,
    SpawnCommand,
    SuccessIsReturn0ErrorFinder,
} from "@atomist/automation-client";
import {
    AppInfo,
    ExecuteGoalResult,
    GoalInvocation,
    GoalProjectListenerEvent,
    GoalProjectListenerRegistration,
    spawnAndWatch,
} from "@atomist/sdm";
import { readSdmVersion } from "@atomist/sdm-core";
import {
    Builder,
    spawnBuilder,
    SpawnBuilderOptions,
} from "@atomist/sdm-pack-build";
import { SpawnOptions } from "child_process";
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
};

export const Install: SpawnCommand = asSpawnCommand("npm ci", DevelopmentEnvOptions);

/**
 * Return a Node builder that will run the following commands using spawn
 * @param {string} commands
 * @return {Builder}
 */
export function nodeBuilder(...commands: string[]): Builder {
    return spawnBuilder(npmBuilderOptions(commands.map(cmd => asSpawnCommand(cmd, DevelopmentEnvOptions))));
}

/**
 * Return a Node builder that will run the following commands using spawn,
 * providing spawn options, for example to allow the provision of environment variables
 * @param opts options passed to spawn
 * @param {string} commands
 * @return {Builder}
 */
export function nodeBuilderWithOptions(opts: SpawnOptions, ...commands: string[]): Builder {
    return spawnBuilder(npmBuilderOptions(commands.map(cmd => asSpawnCommand(cmd, DevelopmentEnvOptions))));
}

function npmBuilderOptions(commands: SpawnCommand[], options?: SpawnOptions): SpawnBuilderOptions {
    return {
        name: "NpmBuilder",
        commands,
        options,
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
    return spawnAndWatch({
            command: "npm",
            args: [hasPackageLock ? "ci" : "install"],
        }, {
            cwd: p.baseDir,
            ...DevelopmentEnvOptions,
        }, goalInvocation.progressLog,
        {
            errorFinder: SuccessIsReturn0ErrorFinder,
        });
}

export async function npmVersionPreparation(p: GitProject, goalInvocation: GoalInvocation): Promise<ExecuteGoalResult> {
    const sdmGoal = goalInvocation.sdmGoal;
    const version = await readSdmVersion(
        sdmGoal.repo.owner,
        sdmGoal.repo.name,
        sdmGoal.repo.providerId,
        sdmGoal.sha,
        sdmGoal.branch,
        goalInvocation.context);
    return spawnAndWatch({
            command: "npm",
            args: ["--no-git-tag-version", "version", version],
        },
        {
            cwd: p.baseDir,
        },
        goalInvocation.progressLog,
        {
            errorFinder: SuccessIsReturn0ErrorFinder,
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
    return spawnAndWatch({
            command: "npm",
            args: ["run", "compile"],
        }, {
            cwd: p.baseDir,
            ...DevelopmentEnvOptions,
        }, goalInvocation.progressLog,
        {
            errorFinder: SuccessIsReturn0ErrorFinder,
        });
}

export const NpmCompileProjectListener: GoalProjectListenerRegistration = {
    name: "npm compile",
    pushTest: IsNode,
    listener: async (p, r, event): Promise<void | ExecuteGoalResult> => {
        if (GoalProjectListenerEvent.before === event) {
            return npmCompilePreparation(p, r);
        }
    },
};

export const NodeModulesProjectListener: GoalProjectListenerRegistration = {
    name: "npm install",
    listener: async (p, gi, phase) => {
        // Check if project has a package.json
        if (!(await p.hasFile("package.json"))) {
            return;
        }

        if (phase === GoalProjectListenerEvent.before) {
            return cacheNodeModules(p, gi);
        }
    },
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
        "/opt/data")}/${gi.sdmGoal.goalSetId}-node_modules.tar.gz`;
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
                          gi: GoalInvocation): Promise<ChildProcessResult> {
    return spawnAndWatch(
        {
            command: "npm",
            args: [cmd],
        },
        {
            cwd: p.baseDir,
            env: {
                ...process.env,
                NODE_ENV: "development",
            },
        },
        gi.progressLog,
        {
            errorFinder: SuccessIsReturn0ErrorFinder,
        });
}

async function compress(name: string,
                        p: GitProject,
                        gi: GoalInvocation): Promise<ChildProcessResult> {
    return spawnAndWatch(
        {
            command: "tar",
            args: ["-zcf", name, "node_modules"],
        },
        {
            cwd: p.baseDir,
        },
        gi.progressLog,
        {
            errorFinder: SuccessIsReturn0ErrorFinder,
        });
}

async function extract(name: string,
                       p: GitProject,
                       gi: GoalInvocation): Promise<ChildProcessResult> {
    return spawnAndWatch(
        {
            command: "tar",
            args: ["-xf", name],
        },
        {
            cwd: p.baseDir,
        },
        gi.progressLog,
        {
            errorFinder: SuccessIsReturn0ErrorFinder,
        });
}
