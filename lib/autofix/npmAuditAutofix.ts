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
    isLocalProject,
    logger,
} from "@atomist/automation-client";
import {
    AutofixRegistration,
    execPromise,
    hasFile,
} from "@atomist/sdm";
import { DevelopmentEnvOptions } from "../build/npmBuilder";

const Package = "package.json";

/**
 * Autofix to run npm audit fix on a project.
 */
export const NpmAuditAutofix: AutofixRegistration = {
    name: "NPM audit",
    pushTest: hasFile(Package),
    transform: async p => {
        if (!isLocalProject(p)) {
            return p;
        }

        const cwd = p.baseDir;
        try {
            await execPromise(
                "npm",
                ["audit", "fix"],
                {
                    cwd,
                    ...DevelopmentEnvOptions,
                });
        } catch (e) {
            logger.warn(`Failed to run npm audit fix: ${e.message}`);
        }

        return p;
    },
};
