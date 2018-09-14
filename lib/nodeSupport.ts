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
    ExtensionPack,
    metadata,
    SoftwareDeliveryMachine,
} from "@atomist/sdm";
import { AddBuildScript } from "./autofix/addBuildScript";
import { tslintFix } from "./autofix/tslintFix";
import { PackageLockFingerprinter } from "./fingerprint/PackageLockFingerprinter";
import { CommonTypeScriptErrors } from "./reviewer/typescript/commonTypeScriptErrors";
import { DontImportOwnIndex } from "./reviewer/typescript/dontImportOwnIndex";

/**
 * This shows how to add a Node generator to your SDM.
 * We recommend that you add your own, with a startingPoint of your choice.
 * @param {SoftwareDeliveryMachine} sdm
 * @param options config options
 */
export const NodeSupport: ExtensionPack = {
    ...metadata(),
    configure: (sdm: SoftwareDeliveryMachine) => {
        sdm.addAutofix(tslintFix)
            .addAutofix(AddBuildScript)
            .addAutoInspectRegistration(CommonTypeScriptErrors)
            .addAutoInspectRegistration(DontImportOwnIndex)
            .addFingerprinterRegistration(new PackageLockFingerprinter());
    },
};
