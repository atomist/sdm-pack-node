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
} from "@atomist/automation-client";
import {
    ExecuteGoalResult,
    GoalInvocation,
    GoalProjectListenerEvent,
    GoalProjectListenerRegistration,
    spawnLog,
} from "@atomist/sdm";
import {
    cachePut,
    cacheRestore,
    readSdmVersion,
} from "@atomist/sdm-core";
import { npmSpawnLogOptions } from "../npm/spawn";
import { IsNode } from "../pushtest/nodePushTests";

/**
 * Update package files with pre-release version for the provided goal
 * invocation.
 *
 * @param p Project to modify package files in
 * @param gi SDM goal invocation triggering this preparation
 * @return Success or failure
 */
export async function npmVersionPreparation(p: GitProject, gi: GoalInvocation): Promise<ExecuteGoalResult> {
    const goalEvent = gi.goalEvent;
    const repo = goalEvent.repo;
    const version = await readSdmVersion(repo.owner, repo.name, repo.providerId, goalEvent.sha, goalEvent.branch, gi.context);
    return spawnLog("npm", ["version", "--no-git-tag-version", version], npmSpawnLogOptions(p, gi.progressLog));
}

/**
 * Install Node.js dependencies using NPM, runnning `npm install` or
 * `npm ci`, as appropriate.
 *
 * @param p Project to install dependencies for
 * @param gi SDM goal invocation triggering this preparation
 * @return Success or failure
 */
export async function npmInstallPreparation(p: GitProject, gi: GoalInvocation): Promise<ExecuteGoalResult> {
    const hasPackageLock = await p.hasFile("package-lock.json");
    const installCmd = hasPackageLock ? "ci" : "install";
    return spawnLog("npm", [installCmd], npmSpawnLogOptions(p, gi.progressLog));
}

/**
 * Run NPM package compile script, if present.
 *
 * @param p Project to run compile script in
 * @param gi SDM goal invocation triggering this preparation
 * @return Success or failure
 */
export async function npmCompilePreparation(p: GitProject, gi: GoalInvocation): Promise<ExecuteGoalResult> {
    return spawnLog("npm", ["run", "--if-present", "compile"], npmSpawnLogOptions(p, gi.progressLog));
}

/**
 * Project listener that runs [[npmVersionPreparation]] before executing goal.
 */
export const NpmVersionProjectListener: GoalProjectListenerRegistration = {
    events: [GoalProjectListenerEvent.before],
    listener: npmVersionPreparation,
    name: "npm version",
    pushTest: IsNode,
};

/**
 * Project listener that runs [[npmInstallPreparation]] before executing goal.
 */
export const NpmInstallProjectListener: GoalProjectListenerRegistration = {
    events: [GoalProjectListenerEvent.before],
    listener: npmInstallPreparation,
    name: "npm install",
    pushTest: IsNode,
};

/**
 * Project listener that runs [[npmCompilePreparation]] before executing goal.
 */
export const NpmCompileProjectListener: GoalProjectListenerRegistration = {
    events: [GoalProjectListenerEvent.before],
    listener: npmCompilePreparation,
    name: "npm compile",
    pushTest: IsNode,
};

const npmNodeModulesCacheClassifier = "npm-node_modules-cache";

/**
 * Listener that stores the `node_modules` directory in the configured
 * cache after a goal invocation.
 */
export const NpmNodeModulesCachePut = cachePut({
    entries: [
        { classifier: npmNodeModulesCacheClassifier, pattern: { directory: "node_modules" } },
    ],
    pushTest: IsNode,
});

/**
 * Listener that restores the `node_modules` directory from the
 * configured cache before a goal invocation.
 */
export const NpmNodeModuledCacheRestore = cacheRestore({
    entries: [{ classifier: npmNodeModulesCacheClassifier }],
    onCacheMiss: {
        name: "cache-miss-npm-install",
        listener: npmInstallPreparation,
    },
    pushTest: IsNode,
});

const typescriptCompileCacheClassifier = "ts-compile-cache";

/**
 * Listener that stores the output from TypeScript compilation in the
 * configured cache after a goal invocation.
 */
export const TypeScriptCompileCachePut = cachePut({
    entries: [
        {
            classifier: typescriptCompileCacheClassifier,
            pattern: {
                globPattern: [
                    "index.{d.ts,js}{,.map}",
                    "{bin,lib,test}/**/*.{d.ts,js}{,.map}",
                    "lib/typings/types.ts",
                ],
            },
        },
    ],
    pushTest: IsNode,
});

/**
 * Listener that restores the output from TypeScript compilation from
 * the configured cache before a goal invocation.
 */
export const TypeScriptCompileCacheRestore = cacheRestore({
    entries: [{ classifier: typescriptCompileCacheClassifier }],
    onCacheMiss: {
        name: "cache-miss-typescript-compile",
        listener: npmCompilePreparation,
    },
    pushTest: IsNode,
});
