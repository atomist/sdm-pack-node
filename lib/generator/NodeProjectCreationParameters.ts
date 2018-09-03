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

import { MappedParameters } from "@atomist/automation-client";
import {
    SeedDrivenGeneratorParameters,
} from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import {
    DeclarationType,
    ParametersObject,
    SemVerRegExp,
} from "@atomist/sdm";

/**
 * Parameters for creating Node projects
 */
export interface NodeProjectCreationParameters extends SeedDrivenGeneratorParameters {
    appName: string;
    screenName: string;
    version: string;
}

/**
 * Corresponding parameter definitions
 */
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
    screenName: { declarationType: DeclarationType.mapped, uri: MappedParameters.SlackUserName },
};
