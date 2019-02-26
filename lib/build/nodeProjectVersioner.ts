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

import { configurationValue } from "@atomist/automation-client";
import {
    projectConfigurationValue,
    spawnLog,
} from "@atomist/sdm";
import { ProjectVersioner } from "@atomist/sdm-core";
import * as df from "dateformat";
import { gitBranchToNpmVersion } from "./executePublish";

const TagDefaultBranchConfigKey = "npm.publish.tag.defaultBranch";

export const NodeProjectVersioner: ProjectVersioner = async (sdmGoal, p, log) => {
    const pjFile = await p.getFile("package.json");
    const pj = JSON.parse(await pjFile.getContent());
    const branch = sdmGoal.branch.split("/").join(".");

    const tagMaster = await projectConfigurationValue<boolean>(TagDefaultBranchConfigKey, p,
        configurationValue<boolean>(`sdm.${TagDefaultBranchConfigKey}`, false));

    let branchSuffix = "";
    if (tagMaster) {
        branchSuffix = `${branch}.`;
    } else {
        branchSuffix = branch !== sdmGoal.push.repo.defaultBranch ? `${branch}.` : "";
    }

    let pjVersion = pj.version;
    if (!pjVersion || pjVersion.length === 0) {
        pjVersion = "0.0.1";
    }

    return `${pjVersion}-${gitBranchToNpmVersion(branchSuffix)}${df(new Date(), "yyyymmddHHMMss")}`;
};
