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
    GitHubRepoRef,
    GitProject,
    HandlerResult,
    Success,
} from "@atomist/automation-client";
import {
    doWithProject,
    ExecuteGoal,
    ExecuteGoalResult,
    LoggingProgressLog,
    PrepareForGoalExecution,
    projectConfigurationValue,
    SdmGoalState,
    spawnLog,
} from "@atomist/sdm";
import {
    github,
    ProjectIdentifier,
} from "@atomist/sdm-core";
import * as fs from "fs-extra";
import * as p from "path";

/**
 * Execute npm publish
 *
 * Tags with branch-name unless the `tag` option is specified
 *
 * @param {ProjectLoader} projectLoader
 * @param {ProjectIdentifier} projectIdentifier
 * @param {PrepareForGoalExecution[]} preparations
 * @return {ExecuteGoal}
 */
export function executePublish(
    projectIdentifier: ProjectIdentifier,
    options: NpmOptions,
): ExecuteGoal {

    return doWithProject(async goalInvocation => {
        const { credentials, id, project } = goalInvocation;
        if (!(await projectConfigurationValue<boolean>("npm.publish.enabled", project, true))) {
            return {
                code: 0,
                description: "Publish disabled",
                state: SdmGoalState.success,
            };
        }

        await configure(options, project);

        const args: string[] = [
            p.join(__dirname, "..", "..", "assets", "scripts", "npm-publish.bash"),
        ];
        if (options.registry) {
            args.push("--registry", options.registry);
        }
        const access = await projectConfigurationValue("npm.publish.access", project, options.access);
        if (access) {
            args.push("--access", access);
        }
        if (options.tag) {
            args.push("--tag", options.tag);
        } else {
            args.push("--tag", gitBranchToNpmTag(id.branch));
        }

        const result: ExecuteGoalResult = await goalInvocation.spawn("bash", args);

        if (result.code === 0) {
            const pi = await projectIdentifier(project);
            const url = `${options.registry}/${pi.name}/-/${pi.name}-${pi.version}.tgz`;
            result.externalUrls = [{
                label: "NPM package",
                url,
            }];

            if (options.status) {
                await github.createStatus(
                    credentials,
                    id as GitHubRepoRef,
                    {
                        context: "npm/atomist/package",
                        description: "NPM package",
                        target_url: url,
                        state: "success",
                    });
            }
        }

        return result;
    });
}

export async function deleteBranchTag(
    branch: string,
    project: GitProject,
    options: NpmOptions,
): Promise<HandlerResult> {

    const pj = await project.getFile("package.json");
    if (pj) {
        const tag = gitBranchToNpmTag(branch);
        const name = JSON.parse(await pj.getContent()).name;

        await configure(options, project);
        const result = await spawnLog(
            "npm",
            ["dist-tags", "rm", name, tag],
            {
                cwd: project.baseDir,
                log: new LoggingProgressLog("npm dist-tag rm"),
            });

        return result;
    }
    return Success;
}

/**
 * Create an npmrc file for the package.
 */
async function configure(options: NpmOptions, project: { baseDir: string }): Promise<NpmOptions> {
    await fs.writeFile(p.join(project.baseDir, ".npmrc"), options.npmrc, { mode: 0o600 });
    return options;
}

/**
 * NPM options used when publishing NPM modules.
 */
export interface NpmOptions {
    /** The contents of a .npmrc file, typically containing authentication information */
    npmrc: string;
    /** Optional registry, use NPM default if not present, currently "https://registry.npmjs.org" */
    registry?: string;
    /** Optional publication access, use NPM default if not present, currently "restricted" */
    access?: "public" | "restricted";
    /** Optional publication tag, use NPM default if not present, currently "latest" */
    tag?: string;
    /** Optional flag, to indicate if a status should be created on the SCM containing a link to the package */
    status?: boolean;
}

export function gitBranchToNpmTag(branchName: string): string {
    return `branch-${gitBranchToNpmVersion(branchName)}`;
}

export function gitBranchToNpmVersion(branchName: string): string {
    return branchName.replace(/\//g, "-").replace(/_/g, "-");
}
