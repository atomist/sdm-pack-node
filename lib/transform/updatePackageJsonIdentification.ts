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
    doWithJson,
    logger,
    SeedDrivenGeneratorParameters,
} from "@atomist/automation-client";
import { CodeTransform } from "@atomist/sdm";
import { NodeProjectCreationParameters } from "../generator/NodeProjectCreationParameters";
import { findAuthorName } from "./findAuthorName";

/**
 * Code transform to update identification fields of package.json and package-lock.json
 * @param project
 * @param context
 * @param params
 */
export const UpdatePackageJsonIdentification: CodeTransform<NodeProjectCreationParameters & SeedDrivenGeneratorParameters> =
    async (project, context, params) => {
        const author = await findAuthorName(context.context, params.screenName)
            .then((authorName: string) => authorName || params.screenName,
                (err: Error) => {
                    logger.warn("Cannot query for author name: %s", err.message);
                    return params.screenName;
                });

        let p = await doWithJson(project, "package.json", pkg => {
            const repoUrl = params.target.repoRef.url;
            pkg.name = params.appName;
            pkg.description = params.target.description;
            pkg.version = params.version;
            pkg.author = {
                name: author,
            };
            pkg.repository = {
                type: "git",
                url: `${repoUrl}.git`,
            };
            pkg.homepage = `${repoUrl}#readme`;
            pkg.bugs = {
                url: `${repoUrl}/issues`,
            };
        });

        if (await p.hasFile("package-lock.json")) {
            p = await doWithJson(p, "package-lock.json", pkg => {
                pkg.name = params.appName;
                pkg.version = params.version;
            });
        }

        return p;
    };
