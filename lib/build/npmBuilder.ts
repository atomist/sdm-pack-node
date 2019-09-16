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
    ErrorFinder,
    Project,
    RemoteRepoRef,
} from "@atomist/automation-client";
import {
    GoalProjectListenerRegistration,
    SpawnLogCommand,
} from "@atomist/sdm";
import {
    Builder,
    spawnBuilder,
    SpawnBuilderOptions,
} from "@atomist/sdm-pack-build";
import { AppInfo } from "@atomist/sdm/lib/spi/deploy/Deployment";
import * as _ from "lodash";
import {
    npmCompilePreparation,
    npmInstallPreparation,
    NpmInstallProjectListener,
    NpmNodeModuledCacheRestore,
    npmVersionPreparation,
} from "../listener/npm";
import { DevelopmentEnvOptions } from "../npm/spawn";
import { NpmLogInterpreter } from "./npmLogInterpreter";

/* tslint:disable:deprecation */

/** @deprecated use NpmInstallProjectListener */
export const Install: SpawnLogCommand = { command: "npm", args: ["ci"], options: DevelopmentEnvOptions as any };

/**
 * Run commands after using [[DevelopmentEnvOptions]] as the default
 * [[SpawnLogOptions]].
 * @deprecated Builder interface is deprecated, use npm
 */
export function nodeBuilder(...commands: SpawnLogCommand[]): Builder {
    return spawnBuilder(npmBuilderOptions(commands.map(cmd => ({
        command: cmd.command, args: cmd.args, options: {
            ...DevelopmentEnvOptions,
            ...cmd.options,
        },
    }))));
}

/**
 * When determining if NPM errored, in addition to exit status, look
 * for common NPM error strings in the logs.
 */
export const NpmErrorFinder: ErrorFinder = (code, signal, l) => !!code || !!signal || l.log.startsWith("[error]") || l.log.includes("ERR!");

/**
 * Generate [[SpawnBuilderOptions]] from the provided NPM commands,
 * using information from the package.json file in the project.
 *
 * @param commands NPM commands to wrap in a [[SpawnBuilderOptions]] object
 * @return NPM commands usable by spawnBuilder
 * @deprecated Builder interface is deprecated
 */
function npmBuilderOptions(commands: SpawnLogCommand[]): SpawnBuilderOptions {
    return {
        name: "NpmBuilder",
        commands,
        errorFinder: NpmErrorFinder,
        logInterpreter: NpmLogInterpreter,
        // tslint:disable-next-line:deprecation
        projectToAppInfo: async (p: Project): Promise<AppInfo> => {
            const packageJson = await p.findFile("package.json");
            const content = await packageJson.getContent();
            const pkg = JSON.parse(content);
            return { id: p.id as RemoteRepoRef, name: pkg.name, version: pkg.version };
        },
    };
}

/**
 * Generate [[SpawnBuilderOptions]] from the provided file of NPM
 * commands, using information from the package.json file in the
 * project.
 *
 * @param commandFile File containing NPM commands to wrap in a [[SpawnBuilderOptions]] object
 * @return NPM commands usable by spawnBuilder
 * @deprecated Builder interface is deprecated
 */
export function npmBuilderOptionsFromFile(commandFile: string): SpawnBuilderOptions {
    return {
        name: "NpmBuilder",
        commandFile,
        errorFinder: NpmErrorFinder,
        logInterpreter: NpmLogInterpreter,
        projectToAppInfo: async (p: Project): Promise<AppInfo> => {
            const packageJson = await p.findFile("package.json");
            const content = await packageJson.getContent();
            const pkg = JSON.parse(content);
            return { id: p.id as RemoteRepoRef, name: pkg.name, version: pkg.version };
        },
    };
}

/**
 * Goal preparations when building Node.js projects using NPM.
 * @deprecated use individual preparations
 */
export const NpmPreparations = [npmInstallPreparation, npmVersionPreparation, npmCompilePreparation];
export const NodeModulesProjectListener = NpmInstallProjectListener;

/** @deprecated use NpmNodeModuledCacheRestore */
export function npmInstallProjectListener(options: { scope: CacheScope } = { scope: CacheScope.GoalSet }): GoalProjectListenerRegistration {
    return NpmNodeModuledCacheRestore;
}

/** @deprecated */
export enum CacheScope {
    GoalSet,
    Repository,
}
