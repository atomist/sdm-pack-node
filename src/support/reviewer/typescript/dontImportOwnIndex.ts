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

import { ReviewerRegistration } from "@atomist/sdm";
import { patternMatchReviewer } from "@atomist/sdm/api-helper/code/review/patternMatchReviewer";

/**
 * Importing a project's index file is a recipe for circular import hell
 */
export const DontImportOwnIndex: ReviewerRegistration = patternMatchReviewer(
    "Don't import own index.ts",
    {globPattern: "**/*.ts", severity: "error"},
    {
        name: "import from index",
        antiPattern: /^import.*from ".*index"/,
        comment: `import from relevant file, not index"`,
    },
);
