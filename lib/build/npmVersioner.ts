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
    DefaultGoalNameGenerator,
    formatDate,
    LogSuppressor,
    projectConfigurationValue,
} from "@atomist/sdm";
import {
    ProjectVersioner,
    ProjectVersionerRegistration,
} from "@atomist/sdm-core";
import { NodeConfiguration } from "../nodeSupport";
import { IsNode } from "../pushtest/nodePushTests";
import { gitBranchToNpmVersion } from "./executePublish";

/**
 * Create timestamped pre-prelease, branch-aware version based on
 * version in package.json file.
 */
export const NpmVersioner: ProjectVersioner = async (sdmGoal, p, log) => {
    let pjVersion: string;
    try {
        const pjFile = await p.getFile("package.json");
        const pj: { version: string } = JSON.parse(await pjFile.getContent());
        pjVersion = pj.version;
    } catch (e) {
        log.write(`Error reading version from package.json: ${e.message}`);
    }
    if (!pjVersion) {
        pjVersion = "0.0.0";
        log.write(`Failed to read version from package.json, using '${pjVersion}'`);
    }
    log.write(`Using base version '${pjVersion}'`);
    const branch = sdmGoal.branch.split("/").join(".");

    const tagMaster = await projectConfigurationValue<NodeConfiguration["npm"]["publish"]["tag"]["defaultBranch"]>(
        "npm.publish.tag.defaultBranch", p, false);

    let branchSuffix = "";
    if (tagMaster) {
        branchSuffix = `${branch}.`;
    } else {
        branchSuffix = branch !== sdmGoal.push.repo.defaultBranch ? `${branch}.` : "";
    }

    const prereleaseVersion = `${pjVersion}-${gitBranchToNpmVersion(branchSuffix)}${formatDate()}`;
    log.write(`Calculated pre-release version '${prereleaseVersion}'`);
    return prereleaseVersion;
};

/**
 * Versioner function registration for the [[Version]] goal.
 */
export const NpmVersionerRegistration: ProjectVersionerRegistration = {
    logInterpreter: LogSuppressor,
    name: DefaultGoalNameGenerator.generateName("npm-versioner"),
    pushTest: IsNode,
    versioner: NpmVersioner,
};

/** @deprecated use NpmVersioner */
export const NodeProjectVersioner = NpmVersioner;
