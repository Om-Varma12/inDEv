import { generateCode } from "../src/services/code.service.js";
import type { StructureItem } from "../src/types/project.types.js";

const file: StructureItem = {
    path: "src/components/common/Button/Button.tsx",
    type: "file",
    action: "create",
    description:
        "Renders a reusable, styled <button> element. Props (ButtonProps): label, onClick, variant (defaults to 'number'), span (defaults to 1, applied as grid-column: span N), active (defaults to false, applied as data-attribute for the active visual state), disabled, ariaLabel.",
    exports: [
        {
            name: "Button",
            type: "named",
        },
    ],
    imports: [
        {
            source: "./Button.types",
            type: "named",
            names: ["ButtonProps"],
        },
        {
            source: "./Button.module.css",
            type: "default",
            names: ["styles"],
        },
    ],
};

await generateCode(file);