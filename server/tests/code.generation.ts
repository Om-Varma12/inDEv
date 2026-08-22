import { generateCode } from "../src/services/code/code.service.js";

import type { ProjectStructure } from "../src/types/project.types.js";

import planner from "../sample-outputs/calc-planner.json" with {type: "json"};  
import { initReactProject } from "../src/services/filesystem.service.js";

import { generateProjectStructure } from "../src/services/planner.service.js"


// const structure: ProjectStructure = await generateProjectStructure("build me a simple calulator app with basic four operations.")
await initReactProject("./outputs/calculator")

const structure = planner as ProjectStructure;
await generateCode(structure, "./outputs/calculator");