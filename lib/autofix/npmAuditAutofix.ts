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
    GitProject,
    isLocalProject,
    logger,
} from "@atomist/automation-client";
import {
    AutofixRegistration,
    execPromise,
    hasFile,
} from "@atomist/sdm";
import * as _ from "lodash";
import { DevelopmentEnvOptions } from "../build/npmBuilder";

const Package = "package.json";

export interface NpmAuditFixResult {
    added: [];
    removed: [];
    updated: [];
    moved: [];
}

/**
 * Options to configure the npm audit support
 */
export interface NpmAuditOptions {

    /** Only process the package lock file */
    packageLockOnly?: boolean;
}

export const DefaultNpmAuditOptions = {
    packageLockOnly: true,
};

/**
 * Autofix to run npm audit fix on a project.
 */
export function npmAuditAutofix(options: NpmAuditOptions = DefaultNpmAuditOptions): AutofixRegistration {
    return {
        name: "NPM audit",
        pushTest: hasFile(Package),
        transform: async p => {
            if (!isLocalProject(p)) {
                return p;
            }

            const cwd = p.baseDir;
            try {

                const args = ["audit", "fix", "--json"];
                if (options.packageLockOnly === true) {
                    args.push("--package-lock-only");
                }

                const npmAuditResult = await execPromise(
                    "npm",
                    args,
                    {
                        cwd,
                        ...DevelopmentEnvOptions,
                    });

                const npmAudit = JSON.parse(npmAuditResult.stdout) as NpmAuditFixResult;

                if (_.isEmpty(npmAudit.added) && _.isEmpty(npmAudit.moved)
                    && _.isEmpty(npmAudit.removed) && _.isEmpty(npmAudit.updated)) {
                    await (p as GitProject).revert();
                }

            } catch (e) {
                logger.warn(`Failed to run npm audit fix: ${e.message}`);
            }

            return p;
        },
    };
}
