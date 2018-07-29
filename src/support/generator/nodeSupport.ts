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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    DeclarationType,
    ExtensionPack,
    hasFile, ParametersObject, SemVerRegExp,
    SoftwareDeliveryMachine,
    ToDefaultBranch,
} from "@atomist/sdm";

import * as build from "@atomist/sdm/api-helper/dsl/buildDsl";

import { MappedParameters } from "@atomist/automation-client";
import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import { tslintFix } from "@atomist/sdm-core";
import { IsNode } from "@atomist/sdm-core";
import { nodeBuilder } from "@atomist/sdm-core";
import { PackageLockFingerprinter } from "@atomist/sdm-core";
import { metadata } from "@atomist/sdm/api-helper/misc/extensionPack";
import { AddAtomistTypeScriptHeader } from "../../autofix/addAtomistHeader";
import { UpdateReadmeTitle } from "../../commands/editors/updateReadmeTitle";
import { CommonTypeScriptErrors } from "../../reviewer/typescript/commonTypeScriptErrors";
import { DontImportOwnIndex } from "../../reviewer/typescript/dontImportOwnIndex";
import { AddBuildScript } from "../autofix/addBuildScript";
import { UpdatePackageJsonIdentification } from "../transform/updatePackageJsonIdentification";

export interface NodeProjectCreationParameters extends SeedDrivenGeneratorParameters {
    appName: string;
    screenName: string;
    version: string;
}

export const NodeProjectCreationParametersDefinition: ParametersObject = {

    appName: {
        displayName: "App name",
        description: "Application name",
        pattern: /^(@?[A-Za-z][-A-Za-z0-9_]*)$/,
        validInput: "a valid package.json application name, which starts with a lower-case letter and contains only " +
        " alphanumeric, -, and _ characters, or `${projectName}` to use the project name",
        minLength: 1,
        maxLength: 50,
        required: true,
        order: 51,
    },
    version: {
        ...SemVerRegExp,
        required: false,
        order: 52,
        defaultValue: "0.1.0",
    },
    screenName: { type: DeclarationType.mapped, uri: MappedParameters.SlackUserName},
};

/**
 * Add configuration common to Node SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} sdm
 * @param options config options
 */
export const NodeSupport: ExtensionPack = {
    ...metadata("node"),
    configure: (sdm: SoftwareDeliveryMachine) => {
        const hasPackageLock = hasFile("package-lock.json");
        sdm.addGeneratorCommand({
            name: "typescript-express-generator",
            startingPoint: new GitHubRepoRef("spring-team", "typescript-express-seed"),
            intent: "create node",
            parameters: NodeProjectCreationParametersDefinition,
            transform: [
                UpdatePackageJsonIdentification,
                UpdateReadmeTitle],
        })
            .addGeneratorCommand({
                name: "minimal-node-generator",
                parameters: NodeProjectCreationParametersDefinition,
                startingPoint: new GitHubRepoRef("spring-team", "minimal-node-seed"),
                intent: "create minimal node",
                transform: [
                    UpdatePackageJsonIdentification,
                    UpdateReadmeTitle],
            })
            .addGeneratorCommand({
                name: "copySdm",
                parameters: NodeProjectCreationParametersDefinition,
                startingPoint: new GitHubRepoRef("atomist", "sdm"),
                intent: "copy sdm",
                transform: [
                    UpdatePackageJsonIdentification,
                    UpdateReadmeTitle],
            })
            .addGeneratorCommand({
                name: "buildable-node-generator",
                parameters: NodeProjectCreationParametersDefinition,
                startingPoint: new GitHubRepoRef("spring-team", "buildable-node-seed"),
                intent: "create buildable node",
                transform: [
                    UpdatePackageJsonIdentification,
                    UpdateReadmeTitle],
            })
            .addAutofix(AddAtomistTypeScriptHeader)
            .addAutofix(tslintFix)
            .addAutofix(AddBuildScript)
            .addReviewerRegistration(CommonTypeScriptErrors)
            .addReviewerRegistration(DontImportOwnIndex)
            .addFingerprinterRegistration(new PackageLockFingerprinter())
            .addBuildRules(
                build.when(IsNode, ToDefaultBranch, hasPackageLock)
                    .itMeans("npm run build")
                    .set(nodeBuilder(sdm, "npm ci", "npm run build")),
                build.when(IsNode, hasPackageLock)
                    .itMeans("npm run compile")
                    .set(nodeBuilder(sdm, "npm ci", "npm run compile")),
                build.when(IsNode, ToDefaultBranch)
                    .itMeans("npm run build - no package lock")
                    .set(nodeBuilder(sdm, "npm i", "npm run build")),
                build.when(IsNode)
                    .itMeans("npm run compile - no package lock")
                    .set(nodeBuilder(sdm, "npm i", "npm run compile")));

    },
};
