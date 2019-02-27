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

import {
    AutofixRegistration,
    CodeInspectionRegistration,
    doWithProject,
    Fingerprint,
    goal,
    Goal,
    goals,
    Goals,
    GoalsBuilder,
    GoalWithFulfillment,
    isMaterialChange,
} from "@atomist/sdm";
import { Version } from "@atomist/sdm-core";
import {
    AutofixRegisteringInterpreter,
    CodeInspectionRegisteringInterpreter,
    Interpretation,
    Interpreter,
} from "@atomist/sdm-pack-analysis";
import { Build } from "@atomist/sdm-pack-build";
import {
    fingerprintRunner,
    runFingerprints,
} from "@atomist/sdm-pack-fingerprints";
import {
    EslintAutofix,
} from "../autofix/eslintAutofix";
import { PackageLockUrlRewriteAutofix } from "../autofix/packageLockUrlRewriteAutofix";
import { NodeDefaultOptions } from "../build/nodeOptions";
import { NodeProjectVersioner } from "../build/nodeProjectVersioner";
import {
    CacheScope,
    nodeBuilder,
    npmInstallProjectListener,
} from "../build/npmBuilder";
import { NpmDependencyFingerprint } from "../fingerprint/dependencies";
import { EslintInspection } from "../inspection/eslint";
import { IsNode } from "../pushtest/nodePushTests";
import { NodeStack } from "./nodeScanner";

export interface NodeDeliveryOptions {
    createBuildGoal: () => Build;
    createTestGoal: () => GoalWithFulfillment;
    configureTestGoal?: (testGoal: GoalWithFulfillment) => void;
}

export class NodeBuildInterpreter implements Interpreter, AutofixRegisteringInterpreter, CodeInspectionRegisteringInterpreter {

    private readonly versionGoal: Version = new Version().withVersioner(NodeProjectVersioner);

    private readonly fingerprintGoal: Fingerprint = new Fingerprint({ isolate: true })
        .with({
            pushTest: IsNode,
            name: "node-fingerprint",
            action: runFingerprints(fingerprintRunner([NpmDependencyFingerprint])),
        });

    private readonly buildGoal: Build;

    private readonly testGoal: Goal;

    public async enrich(interpretation: Interpretation): Promise<boolean> {
        const nodeStack = interpretation.reason.analysis.elements.node as NodeStack;
        if (!nodeStack) {
            return false;
        }

        const hasBuild = !!(nodeStack.packageJson.scripts || {}).build;

        if (hasBuild && !interpretation.buildGoals) {
            interpretation.buildGoals = goals("build")
                .plan(this.versionGoal)
                .plan(this.buildGoal).after(this.versionGoal);
        }

        const hasTest = !!(nodeStack.packageJson.scripts || {}).test;
        if (hasTest) {
            interpretation.testGoals = goals("test")
                .plan(this.testGoal);
            if (!hasBuild) {
                interpretation.buildGoals = goals("build")
                    .plan(this.versionGoal);
            }
        }

        let checkGoals: Goals & GoalsBuilder = goals("checks");
        if (!!interpretation.checkGoals) {
            checkGoals = goals("checks").plan(interpretation.checkGoals).plan(interpretation.checkGoals);
        }
        checkGoals.plan(this.fingerprintGoal);
        interpretation.checkGoals = checkGoals;

        if (!!nodeStack.javaScript && !!nodeStack.javaScript.eslint) {
            const eslint = nodeStack.javaScript.eslint;
            if (eslint.hasDependency && eslint.hasConfig) {
                interpretation.autofixes.push(EslintAutofix);
                interpretation.inspections.push(EslintInspection);
            }
        }

        interpretation.autofixes.push(PackageLockUrlRewriteAutofix);

        interpretation.materialChangePushTests.push(isMaterialChange({
            extensions: ["ts", "js", "jsx", "tsx", "json", "pug", "html", "css"],
            directories: [".atomist"],
        }));

        return true;
    }

    get autofixes(): AutofixRegistration[] {
        return [EslintAutofix, PackageLockUrlRewriteAutofix];
    }

    get codeInspections(): Array<CodeInspectionRegistration<any>> {
        return [EslintInspection];
    }

    constructor(opts: Partial<NodeDeliveryOptions> = {}) {
        const optsToUse: NodeDeliveryOptions = {
            createBuildGoal: createDefaultBuildGoal,
            createTestGoal: createDefaultTestGoal,
            ...opts,
        };
        this.buildGoal = optsToUse.createBuildGoal();

        const testGoal = optsToUse.createTestGoal();
        if (optsToUse.configureTestGoal) {
            optsToUse.configureTestGoal(testGoal);
        }
        this.testGoal = testGoal;
    }
}

function createDefaultBuildGoal(): Build {
    return new Build({
        displayName: "npm build",
        isolate: true,
    }).with({
        ...NodeDefaultOptions,
        name: "npm-run-build",
        builder: nodeBuilder({ command: "npm", args: ["run", "build"] }),
    })
        .withProjectListener(npmInstallProjectListener({ scope: CacheScope.Repository }));
}

function createDefaultTestGoal(): GoalWithFulfillment {
    return goal({
        displayName: "npm test",
        retry: true,
        isolate: true,
        descriptions: {
            inProcess: "Running NPM test",
            failed: "Test failures from NPM test",
            completed: "NPM test passed",
        },
    }).with({
        ...NodeDefaultOptions,
        name: "npm-run-test",
        goalExecutor: doWithProject(
            async gi => {
                return gi.spawn("npm", ["run", "test"]);
            },
        ),
    })
        .withProjectListener(npmInstallProjectListener({ scope: CacheScope.Repository }));
}
