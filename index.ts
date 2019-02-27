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

export { TypeScriptImportsAutofix } from "./lib/autofix/typescript/tsImports";
export { TslintAutofix } from "./lib/autofix/typescript/tslintAutofix";
export { EslintAutofix } from "./lib/autofix/eslintAutofix";
export { PackageJsonFormatingAutofix } from "./lib/autofix/packageJsonFormat";
export { PackageLockUrlRewriteAutofix } from "./lib/autofix/packageLockUrlRewriteAutofix";
export { AddThirdPartyLicenseAutofix } from "./lib/autofix/thirdPartyLicense";

export { NpmDependencyFingerprint } from "./lib/fingerprint/dependencies";
export { PackageLockFingerprint } from "./lib/fingerprint/PackageLockFingerprint";

export {
    EslintInspection,
    esLintReviewCategory,
} from "./lib/inspection/eslint";
export {
    TslintInspection,
    tsLintReviewCategory,
} from "./lib/inspection/tslint";

export {
    nodeSupport,
    NodeSupportOptions,
} from "./lib/nodeSupport";

export { TryToUpdateAtomistDependencies } from "./lib/transform/tryToUpdateAtomistDependencies";
export { TryToUpdateAtomistPeerDependencies } from "./lib/transform/tryToUpdateAtomistPeerDependencies";
export { TryToUpdateDependency } from "./lib/transform/tryToUpdateDependency";
export { UpdatePackageJsonIdentification } from "./lib/transform/updatePackageJsonIdentification";
export { UpdatePackageVersion } from "./lib/transform/updatePackageVersion";
export { UpdateReadmeTitle } from "./lib/transform/updateReadmeTitle";

export {
    NodeProjectCreationParametersDefinition,
    NodeProjectCreationParameters,
} from "./lib/generator/NodeProjectCreationParameters";

export {
    IsNode,
} from "./lib/pushtest/nodePushTests";
export { IsTypeScript } from "./lib/pushtest/tsPushTests";
export { NodeProjectIdentifier } from "./lib/build/nodeProjectIdentifier";
export {
    NpmOptions,
    deleteBranchTag,
    executePublish,
    gitBranchToNpmTag,
    configureNpmRc,
} from "./lib/build/executePublish";
export { IsAtomistAutomationClient } from "./lib/pushtest/nodePushTests";
export { NodeProjectVersioner } from "./lib/build/nodeProjectVersioner";
export {
    nodeBuilder,
    DevelopmentEnvOptions,
    NpmPreparations,
    npmBuilderOptionsFromFile,
    npmCompilePreparation,
    npmInstallPreparation,
    npmVersionPreparation,
    Install,
    NodeModulesProjectListener,
    NpmInstallProjectListener,
    npmInstallProjectListener,
    NpmCompileProjectListener,
    NpmVersionProjectListener,
} from "./lib/build/npmBuilder";
export {
    NpmProgressReporter,
} from "./lib/build/npmProgressReporter";
export { NodeDefaultOptions } from "./lib/build/nodeOptions";
export {
    nodeScanner,
    NodeStack,
} from "./lib/stack/nodeScanner";
export {
    NodeBuildInterpreter,
    NodeDeliveryOptions,
} from "./lib/stack/NodeBuildInterpreter";
export { nodeStackSupport } from "./lib/stack/nodeStackSupport";
export * from "./lib/autofix/eslintAutofix";
export { PackageJsonTransformRecipeContributor } from "./lib/stack/PackageJsonTransformRecipeContributor";
export { PackageJson } from "./lib/util/PackageJson";
