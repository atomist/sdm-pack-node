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

import { InMemoryProject } from "@atomist/automation-client";
import { formatDate } from "@atomist/sdm";
import * as assert from "power-assert";
import { NpmVersioner } from "../../lib/build/npmVersioner";

describe("build/npmVersioner", () => {

    describe("NpmVersioner", () => {

        it("returns timestamped version", async () => {
            const g: any = {
                branch: "master",
                push: {
                    repo: {
                        defaultBranch: "master",
                    },
                },
            };
            const p: any = InMemoryProject.of({ path: "package.json", content: `{"version":"1.2.3"}` });
            const l: any = {
                write: () => { },
            };
            const da = formatDate();
            const v = await NpmVersioner(g, p, l);
            const db = formatDate();
            if (da === db) {
                assert(v === `1.2.3-${da}`);
            } else {
                assert(v === `1.2.3-${da}` || v === `1.2.3-${db}`);
            }
        });

        it("returns branch aware timestamped version", async () => {
            const g: any = {
                branch: "not-master",
                push: {
                    repo: {
                        defaultBranch: "master",
                    },
                },
            };
            const p: any = InMemoryProject.of({ path: "package.json", content: `{"version":"1.2.3"}` });
            const l: any = {
                write: () => { },
            };
            const da = formatDate();
            const v = await NpmVersioner(g, p, l);
            const db = formatDate();
            if (da === db) {
                assert(v === `1.2.3-not-master.${da}`);
            } else {
                assert(v === `1.2.3-not-master.${da}` || v === `1.2.3-not-master.${db}`);
            }
        });

    });

});
