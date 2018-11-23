import { LogSuppressor } from "@atomist/sdm";
import { IsNode } from "../pushtest/nodePushTests";
import { NpmProgressReporter } from "./npmProgressReporter";

export const NodeDefaultOptions = {
    pushTest: IsNode,
    logInterpreter: LogSuppressor,
    progressReporter: NpmProgressReporter,
};