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
    NoParameters,
    Project,
    ProjectReview,
    ReviewComment,
    Severity,
} from "@atomist/automation-client";
import {
    CodeInspection,
    CodeInspectionRegistration,
    spawnPromise,
} from "@atomist/sdm";
import {
    codeLine,
    italic,
} from "@atomist/slack-messages";
import * as _ from "lodash";

export interface NpmAuditAdvisory {
    module_name: string;
    vulnerable_versions: string;
    severity: "info" | "low" | "moderate" | "high" | "critical";
    title: string;
    findings: Array<{ version: string, paths: string[] }>;
    cves: string[];
    url: string;
    recommendation: string;
}

export interface NpmAuditResult {
    advisories: { [id: string]: NpmAuditAdvisory };
}

export const npmAuditReviewCategory = "npm-audit";

function npmAuditReviewComment(
    detail: string,
    rule: string,
    severity: Severity = "info",
): ReviewComment {

    return {
        category: npmAuditReviewCategory,
        detail,
        severity,
        subcategory: rule,
    };
}

export function mapNpmAuditResultsToReviewComments(npmAuditOutput: string, dir: string): ReviewComment[] {
    let results: NpmAuditResult;
    try {
        results = JSON.parse(npmAuditOutput);
    } catch (e) {
        logger.error(`Failed to parse npm audit output '${npmAuditOutput}': ${e.message}`);
        return [];
    }

    return _.map(results.advisories, v => {
        const rule = `${v.module_name}:${v.vulnerable_versions}`;
        let details = `[${v.title}](${v.url})`;
        if (!!v.recommendation) {
            details = `${details} ${italic(v.recommendation.trim())}`;
        }
        if (!!v.cves && v.cves.length > 0) {
            details = `${details} - ${v.cves.map(c => `[${c}](https://nvd.nist.gov/vuln/detail/${c})`)}`;
        }
        if (!!v.findings && v.findings.length > 0) {
            const findings = v.findings.map(f => `\n  - ${codeLine(`${v.module_name}:${f.version}`)}: ${(f.paths || []).map(p => `\n    - ${codeLine(p)}`)}`);
            details = `${details} ${findings}`;
        }
        let severity: Severity;
        switch (v.severity) {
            case "info":
            case "low":
                severity = "info";
                break;
            case "moderate":
                severity = "warn";
                break;
            case "high":
            case "critical":
                severity = "error";
                break;
        }

        return npmAuditReviewComment(details, rule, severity);
    });
}

export const RunNpmAuditOnProject: CodeInspection<ProjectReview, NoParameters> = async (p: Project) => {
    const review: ProjectReview = { repoId: p.id, comments: [] };

    if (!isLocalProject(p)) {
        logger.error(`Project ${p.name} is not a local project`);
        return review;
    }

    const cwd = p.baseDir;

    try {
        const npmAuditResult = await spawnPromise("npm", ["audit", "--json"], { cwd });
        if (npmAuditResult.stderr) {
            logger.debug(`npm audit standard error from ${p.name}: ${npmAuditResult.stderr}`);
        }
        const comments = mapNpmAuditResultsToReviewComments(npmAuditResult.stdout, p.baseDir);
        review.comments.push(...comments);
    } catch (e) {
        logger.error(`Failed to run npm audit: ${e.message}`);
    }

    return review;
};

export const NpmAuditInspection: CodeInspectionRegistration<ProjectReview, NoParameters> = {
    name: "NpmAuditInspection",
    description: "Run npm audit on project",
    inspection: RunNpmAuditOnProject,
    intent: "npm audit",
};
