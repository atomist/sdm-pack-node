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
import * as _ from "lodash";
import * as p from "path";
import { NodeConfiguration } from "../nodeSupport";

/**
 * Execute npm publish
 *
 * Tags with branch-name unless the `tag` option is specified. If the branch === the repo's default branch
 * also the next tags is being set
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
        const { credentials, id, project, goalEvent } = goalInvocation;
        if (!(await projectConfigurationValue<NodeConfiguration["npm"]["publish"]["enabled"]>("npm.publish.enabled", project, true))) {
            return {
                code: 0,
                description: "Publish disabled",
                state: SdmGoalState.success,
            };
        }

        await configureNpmRc(options, project);

        const args: string[] = [
            p.join(__dirname, "..", "..", "assets", "scripts", "npm-publish.bash"),
        ];
        if (!!options.registry) {
            args.push("--registry", options.registry);
        }
        const access = await projectConfigurationValue<NodeConfiguration["npm"]["publish"]["access"]>("npm.publish.access",
            project, options.access);
        if (access) {
            args.push("--access", access);
        }
        if (!!options.tag) {
            args.push("--tag", options.tag);
        } else {
            args.push(..._.flatten(
                gitBranchToNpmTag(id.branch, goalEvent.push.repo.defaultBranch).map(t => ["--tag", t])));
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

        await configureNpmRc(options, project);
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
export async function configureNpmRc(options: NpmOptions, project: { baseDir: string }): Promise<NpmOptions> {
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

export function gitBranchToNpmTag(branchName: string, defaultBranchName: string = "master"): string[] {
    const tags = [`branch-${gitBranchToNpmVersion(branchName)}`];
    if (branchName === defaultBranchName) {
        tags.push("next");
    }
    return tags;
}

export function gitBranchToNpmVersion(branchName: string): string {
    return branchName.replace(/\//g, "-")
        .replace(/_/g, "-")
        .replace(/@/g, "");
}
