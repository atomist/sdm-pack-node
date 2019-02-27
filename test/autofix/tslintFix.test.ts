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
    GitCommandGitProject,
    GitHubRepoRef,
    InMemoryProjectFile,
    RemoteRepoRef,
} from "@atomist/automation-client";
import {
    executeAutofixes,
    fakeGoalInvocation,
    SingleProjectLoader,
} from "@atomist/sdm";
import { DefaultRepoRefResolver } from "@atomist/sdm-core";
import * as assert from "power-assert";
import { TslintAutofix } from "../../lib/autofix/typescript/tslintAutofix";

describe("tsLintFix", () => {

    it("should lint and make fixes", async () => {
        // tslint:disable-next-line:no-null-keyword
        const p = await GitCommandGitProject.cloned({ token: null }, GitHubRepoRef.from({
            owner: "atomist",
            repo: "tree-path-ts",
            branch: "master",
        }));
        const sha = (await p.gitStatus()).sha;
        // Make commit and push harmless
        p.commit = async () => {
            return p;
        };
        p.push = async () => {
            return p;
        };
        const f = new InMemoryProjectFile("src/bad.ts", "const foo\n\n");
        const pl = new SingleProjectLoader(p);
        // Now mess it up with a lint error
        await p.addFile(f.path, f.content);

        await executeAutofixes([TslintAutofix])(fakeGoalInvocation({...p.id as RemoteRepoRef, sha}, {
            projectLoader: pl,
            repoRefResolver: new DefaultRepoRefResolver(),
        } as any));
        const fileNow = p.findFileSync(f.path);
        assert(!!fileNow, "Did not find file: " + f.path);
        const contentNow = fileNow.getContentSync();
        assert(contentNow.startsWith("const foo;"), contentNow);
    }).timeout(90000);

});
