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

import { Project } from "@atomist/automation-client";
import {
    NamedParameter,
    SdmContext,
} from "@atomist/sdm";
import {
    ProjectAnalysis,
    TransformRecipe,
    TransformRecipeContributor,
} from "@atomist/sdm-pack-analysis";
import { NodeProjectCreationParametersDefinition } from "../generator/NodeProjectCreationParameters";
import { UpdatePackageJsonIdentification } from "../transform/updatePackageJsonIdentification";
import { NodeStack } from "./nodeScanner";

/**
 * Add transform for package.json identification.
 * Depends on Node pack.
 */
export class PackageJsonTransformRecipeContributor implements TransformRecipeContributor {

    public async analyze(p: Project, analysis: ProjectAnalysis, sdmContext: SdmContext): Promise<TransformRecipe | undefined> {
        if (!analysis.elements.node) {
            return undefined;
        }
        const parameters: NamedParameter[] = [];
        const nodestack = analysis.elements.node as NodeStack;
        for (const name of Object.getOwnPropertyNames(NodeProjectCreationParametersDefinition)) {
            parameters.push({ name, ...(NodeProjectCreationParametersDefinition as any)[name] });
        }
        return {
            parameters,
            transforms: [
                UpdatePackageJsonIdentification,
            ],
        };
    }

}
