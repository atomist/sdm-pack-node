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
    allSatisfied,
    BuildGoal,
    ExtensionPack,
    SoftwareDeliveryMachine,
    ToDefaultBranch,
} from "@atomist/sdm";

import * as build from "@atomist/sdm/api-helper/dsl/buildDsl";

import { tslintFix } from "@atomist/sdm-core";
import { nodeBuilder } from "@atomist/sdm-core";
import { PackageLockFingerprinter } from "@atomist/sdm-core";
import { IsNode } from "@atomist/sdm-core";
import { executeBuild } from "@atomist/sdm/api-helper/goal/executeBuild";
import { metadata } from "@atomist/sdm/api-helper/misc/extensionPack";
import { AddBuildScript } from "./support/autofix/addBuildScript";
import { NpmLogInterpreter } from "./support/build/npmLogInterpreter";
import { HasPackageLock } from "./support/pushtest/nodePushTests";
import { CommonTypeScriptErrors } from "./support/reviewer/typescript/commonTypeScriptErrors";
import { DontImportOwnIndex } from "./support/reviewer/typescript/dontImportOwnIndex";

/**
 * This shows how to add a Node generator to your SDM.
 * We recommend that you add your own, with a startingPoint of your choice.
 * @param {SoftwareDeliveryMachine} sdm
 * @param options config options
 */
export const NodeSupport: ExtensionPack = {
    ...metadata("node"),
    configure: (sdm: SoftwareDeliveryMachine) => {
        sdm
            .addAutofix(tslintFix)
            .addAutofix(AddBuildScript)
            .addReviewerRegistration(CommonTypeScriptErrors)

            .addReviewerRegistration(DontImportOwnIndex)
            .addFingerprinterRegistration(new PackageLockFingerprinter())
            .addBuildRules(
                build.when(IsNode, ToDefaultBranch, HasPackageLock)
                    .itMeans("npm run build")
                    .set(nodeBuilder(sdm, "npm ci", "npm run build")),
                build.when(IsNode, HasPackageLock)
                    .itMeans("npm run compile")
                    .set(nodeBuilder(sdm, "npm ci", "npm run compile")));

    },
};
