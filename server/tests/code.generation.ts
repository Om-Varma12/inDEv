import { generateCode } from "../src/services/code/code.service.js";
import { getProjectStructure, initReactProject } from "../src/services/filesystem.service.js";
import { validate } from "../src/services/validator/validator.service.js"

import type { PlanStructure} from "../src/types/project.types.js";

import planner from "../sample-outputs/calc-planner.json" with {type: "json"};  

import { generatePlanStructure} from "../src/services/planner.service.js"


// const structure: PlanStructure= await generateProjectStructure("build me a simple calulator app with basic four operations.")
// await initReactProject("./outputs/calculator")

// const structure = planner as PlanStructure;
// await generateCode(structure, "./outputs/calculator");

// no need of them here =>
// const projectStructure = await getProjectStructure("./outputs/calculator")
// console.dir(projectStructure, { depth: null });

const response = await validate("./outputs/calculator")
console.log(response)