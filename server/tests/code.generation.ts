import { generateCode } from "../src/services/code.service.js";

import type { ProjectStructure } from "../src/types/project.types.js";

import planner from "../sample-outputs/calc-planner.json" with {type: "json"};  
import { initReactProject } from "../src/services/filesystem.service.js";

const calcPlanner = planner.message as ProjectStructure;


await initReactProject("./outputs/calculator")
await generateCode(calcPlanner, "./outputs/calculator");