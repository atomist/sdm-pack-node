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
    ProgressTest,
    ReportProgress,
    testProgressReporter,
} from "@atomist/sdm";

/**
 * Default progress tests for our NPM-based builds
 * @type {{test: RegExp; phase: string}[]}
 */
export const NpmProgressTests: ProgressTest[] = [{
    test: /Invoking goal hook: pre/i,
    phase: "Atomist pre-goal hook",
}, {
    test: /> atm-git-info/i,
    phase: "Gather git info",
}, {
    test: /> atm-gql-gen/i,
    phase: "Generate GraphQL",
}, {
    test: /> tsc --project \./i,
    phase: "Compile TypeScript",
}, {
    test: /> nyc mocha/i,
    phase: "Run mocha tests with coverage",
}, {
    test: /> mocha --exit/i,
    phase: "Run mocha tests",
}, {
    test: /> mocha --require/i,
    phase: "Run mocha tests",
}, {
    test: /Sending build context to Docker daemon/i,
    phase: "Build docker image",
}, {
    test: /The push refers to .* repository/i, // This used to have 'a repository'; now it is without it.
    phase: "Push docker image",
}, {
    test: /Invoking goal hook: post/i,
    phase: "Atomist post-goal hook",
}, {
    test: /npm-publish.bash/i,
    phase: "npm publish",
}, {
    test: /> tslint/i,
    phase: "Lint TypeScript",
}, {
    test: /> typedoc/i,
    phase: "Generate TypeDoc",
}, {
    test: /> npm 'run' '([\S]*)'/i,
    phase: "Run npm script: $1",
}];

/**
 * Default ReportProgress for our NPM-based builds
 */
export const NpmProgressReporter: ReportProgress = testProgressReporter(...NpmProgressTests);
