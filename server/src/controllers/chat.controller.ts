import type { Request, Response } from "express";
import { generateCode } from "../services/code/code.service.js";
import { initReactProject } from "../services/filesystem.service.js";
import { generatePlanStructure} from "../services/planner.service.js";
import { validate } from "../services/validator/validator.service.js";

export const sendMessage = async (req: Request, res: Response) => {
    const { message, isFirstMsg, projectName} = req.body;
    const projectPath = `../../outputs/${projectName}`;

    const PlanStructure= await generateProjectStructure(message);
    await initReactProject(projectPath)

    await generateCode(projectStructure, projectPath);

    await validate(projectPath);

    res.json({
        success: true,
        message: 'done with the project'
    });

    // console.log("GOT")
};