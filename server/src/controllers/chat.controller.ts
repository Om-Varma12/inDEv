import type { Request, Response } from "express";
import { generateCode } from "../services/code/code.service.js";
import { initReactProject } from "../services/filesystem.service.js";
import { generatePlanStructure} from "../services/planner.service.js";
import { validate } from "../services/validator/validator.service.js";
import sandboxService from "../services/k8s/sandbox.service.js";

export const sendMessage = async (req: Request, res: Response) => {
    const { message, projectName} = req.body;
    
    const sandbox = await sandboxService.createSandbox(projectName);
    const projectPath = `/workspace/${sandbox.safeProjectName}`;

    const PlanStructure = await generatePlanStructure(message);

    await initReactProject(sandbox.podName, projectPath)

    await generateCode(PlanStructure, sandbox.podName, projectPath);

    await validate(sandbox.podName, projectPath);

    res.json({
        success: true,
        message: 'done with the project',
        sandboxId: sandbox.sandboxId,
        safeProjectName: sandbox.safeProjectName,
        podName: sandbox.podName
    });

    // console.log("GOT")
};