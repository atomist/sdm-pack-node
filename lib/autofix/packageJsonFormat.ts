import { AutofixRegistration } from "@atomist/sdm";
import { IsNode } from "../pushtest/nodePushTests";

export const PackageJsonFormatingAutofix: AutofixRegistration = {
    name: "Package JSON format",
    pushTest: IsNode,
    transform: async p => {
        const pjFile = (await p.getFile("package.json"));
        const pj = JSON.parse(await pjFile.getContent());
        await pjFile.setContent(JSON.stringify(pj, undefined, 2) + "\n");
        return p;
    },
};
