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
    DefaultGoalNameGenerator,
    FulfillableGoalWithRegistrations,
    ImplementationRegistration,
    PrepareForGoalExecution,
} from "@atomist/sdm";
import {
    executePublish,
    NpmOptions,
} from "../build/executePublish";
import { NodeProjectIdentifier } from "../build/nodeProjectIdentifier";

export interface NpmPublishRegistration extends ImplementationRegistration {
    options: NpmOptions;
    preparations: PrepareForGoalExecution[];
}

/**
 * Goal that performs NPM registry publication
 */
export class NpmPublish extends FulfillableGoalWithRegistrations<NpmPublishRegistration> {

    constructor(private readonly uniqueName: string = DefaultGoalNameGenerator.generateName("npm-publish")) {

        super({
            uniqueName,
            orderedName: `2-${uniqueName.toLowerCase()}`,
        });
    }

    public with(registration: NpmPublishRegistration): this {
        this.addFulfillment({
            name: registration.name,
            goalExecutor: executePublish(NodeProjectIdentifier, registration.preparations, registration.options),
            pushTest: registration.pushTest,
            logInterpreter: registration.logInterpreter,
            progressReporter: registration.progressReporter,
        });
        return this;
    }
}
