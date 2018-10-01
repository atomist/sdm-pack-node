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

export { NodeSupport } from "./lib/nodeSupport";

export { UpdatePackageJsonIdentification } from "./lib/transform/updatePackageJsonIdentification";
export { UpdateReadmeTitle } from "./lib/transform/updateReadmeTitle";
export {
    NodeProjectCreationParametersDefinition,
    NodeProjectCreationParameters,
} from "./lib/generator/NodeProjectCreationParameters";
export { PackageLockFingerprinter } from "./lib/fingerprint/PackageLockFingerprinter";
export { npmCustomBuilder, HasAtomistBuildFile } from "./lib/build/atomistBuildFileCustomBuilder";
export { nodeBuilder } from "./lib/build/npmBuilder";
export {
    IsNode,
} from "./lib/pushtest/nodePushTests";
export { IsTypeScript } from "./lib/pushtest/tsPushTests";
export { tslintFix } from "./lib/autofix/tslintFix";
export { NodeProjectIdentifier } from "./lib/build/nodeProjectIdentifier";
export {
    NpmOptions,
    deleteBranchTag,
    executePublish,
    gitBranchToNpmTag,
} from "./lib/build/executePublish";
export { IsAtomistAutomationClient } from "./lib/pushtest/nodePushTests";
export { NodeProjectVersioner } from "./lib/build/nodeProjectVersioner";
export {
    DevelopmentEnvOptions,
    NpmPreparations,
} from "./lib/build/npmBuilder";
export {
    NpmProgressReporter,
} from "./lib/build/npmProgressReporter";
