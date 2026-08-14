import type { Request, Response } from "express";
import { generateCode } from "../services/code/code.service.js";
import { initReactProject } from "../services/filesystem.service.js";
import { generateProjectStructure } from "../services/planner.service.js";


export const sendMessage = async (req: Request, res: Response) => {
    const { message, isFirstMsg, projectName} = req.body;
    const projectPath = `../../outputs/${projectName}`;

    const projectStructure = await generateProjectStructure(message);
    await initReactProject(projectPath)

    await generateCode(projectStructure, projectPath);

    res.json({
        success: true,
        message: 'done with the project'
    });
};