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
    AutoCodeInspection,
    Autofix,
    ExtensionPack,
    Fingerprint,
    metadata,
    ReviewListenerRegistration,
} from "@atomist/sdm";
import { AddBuildScript } from "./autofix/addBuildScript";
import { tslintFix } from "./autofix/tslintFix";
import { PackageLockFingerprinter } from "./fingerprint/PackageLockFingerprinter";
import { CommonTypeScriptErrors } from "./reviewer/typescript/commonTypeScriptErrors";
import { DontImportOwnIndex } from "./reviewer/typescript/dontImportOwnIndex";

/**
 * Categories of functionality to enable
 */
export interface Categories {

    typescriptErrors?: boolean;
}

/**
 * Options determining what Node functionality is activated.
 */
export interface NodeSupportOptions {

    /**
     * Inspect goal to add inspections to.
     * Review functionality won't work otherwise.
     */
    inspectGoal?: AutoCodeInspection;

    /**
     * Autofix goal to add autofixes to.
     * Autofix functionality won't work otherwise.
     */
    autofixGoal?: Autofix;

    /**
     * Fingerprint goal to add fingerprints to.
     * Fingerprint functionality won't work otherwise.
     */
    fingerprintGoal?: Fingerprint;

    review: Categories;

    autofix: Categories;

    /**
     * Review listeners that let you publish review results.
     */
    reviewListeners?: ReviewListenerRegistration | ReviewListenerRegistration[];
}

/**
 * Install node support into your SDM.
 * @param options
 */
export function nodeSupport(options: NodeSupportOptions): ExtensionPack {
    return {
        ...metadata(),
        configure: () => {
            if (!!options.inspectGoal) {
                if (options.review.typescriptErrors) {
                    options.inspectGoal
                        .with(CommonTypeScriptErrors)
                        .with(DontImportOwnIndex);
                }
                if (options.reviewListeners) {
                    const listeners = Array.isArray(options.reviewListeners) ?
                        options.reviewListeners : [options.reviewListeners];
                    listeners.forEach(l => options.inspectGoal.withListener(l));
                }
            }
            if (!!options.autofixGoal) {
                if (options.autofix.typescriptErrors) {
                    options.autofixGoal
                        .with(tslintFix)
                        .with(AddBuildScript);
                }
            }
            if (!!options.fingerprintGoal) {
                options.fingerprintGoal.with(new PackageLockFingerprinter());
            }
        },
    };
}
