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

import * as assert from "power-assert";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";

import { successOn } from "@atomist/automation-client/action/ActionResult";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { DefaultRepoRefResolver } from "@atomist/sdm-core";
import { executeAutofixes } from "@atomist/sdm/api-helper/listener/executeAutofixes";
import { fakeGoalInvocation } from "@atomist/sdm/api-helper/test/fakeGoalInvocation";
import { SingleProjectLoader } from "@atomist/sdm/api-helper/test/SingleProjectLoader";

import { tslintFix } from "../../lib/autofix/tslintFix";

describe("tsLintFix", () => {

    it("should lint and make fixes", async () => {
        const p = await GitCommandGitProject.cloned({ token: null }, new GitHubRepoRef("atomist", "tree-path-ts"));
        // Make commit and push harmless
        p.commit = async () => {
            return successOn(p);
        };
        p.push = async () => {
            return successOn(p);
        };
        const f = new InMemoryFile("src/bad.ts", "const foo\n\n");
        const pl = new SingleProjectLoader(p);
        // Now mess it up with a lint error
        await p.addFile(f.path, f.content);

        await executeAutofixes([tslintFix])(fakeGoalInvocation(p.id as RemoteRepoRef, {
            projectLoader: pl,
            repoRefResolver: new DefaultRepoRefResolver(),
        } as any));
        const fileNow = p.findFileSync(f.path);
        assert(!!fileNow, "Did not find file: " + f.path);
        const contentNow = fileNow.getContentSync();
        assert(contentNow.startsWith("const foo;"), contentNow);
    }).timeout(90000);

});
