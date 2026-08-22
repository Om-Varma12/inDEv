import { run, fileListContract } from "../llm/ollama.service.js";
import type { TaskContract } from "../llm/ollama.service.js";
import { runCommand } from "./commands.service.js";
import path from "node:path";

import type { CommandResult } from "../../types/commands.types.js"
import { FolderExtractorPrompt } from "../../prompts/system/fileExtractor.system.js";
import { getProjectStructure, readProjectFile, writeProjectFile } from "../filesystem.service.js";
import type { LLMMessage } from "../../types/llm.types.js";

const ISSUE_FIXER_PROMPT = `
You are a software repair agent. You diagnose build/test/lint errors in a project and output the corrected version of the file that is causing the error.

You will be given:
1. The error details.
2. The contents of the relevant files.

Your task is to analyze the error, identify which file needs to be modified, make the necessary fix, and output the result in the following JSON format. Do not change anything unrelated to the error. Output ONLY this JSON object. No explanation, no markdown fences, no conversational text.

JSON format:
{
  "path": "path/to/file/relative/to/project/root",
  "code": "the full, corrected code of the file"
}
`;

interface FixResponse {
    path: string;
    code: string;
}

const fixContract: TaskContract<FixResponse> = {
    validate: (parsed): parsed is FixResponse =>
        typeof parsed === "object" &&
        parsed !== null &&
        "path" in parsed &&
        typeof (parsed as any).path === "string" &&
        "code" in parsed &&
        typeof (parsed as any).code === "string",
    fallback: (rawContent) => ({
        path: "",
        code: rawContent
    })
};

export const validate = async(
    projectPath: string
) => {
    console.log("validating project")
    
    const cmds = [
        "npx tsc --noEmit",
        "npm run lint",
        "npm run build"
    ];
    
    for(const cmd of cmds){
        const result = await runCommand(
            cmd,
            projectPath
        );
        
        if(!result.success){
            console.log(`validation failed for: ${cmd}`)
            await fixIssue(result, projectPath);
        }
        console.log(`validated: ${cmd}`)
    }

    return{
        success: true
    }
}


async function fixIssue(
    issue: CommandResult,
    projectPath: string
){
    const projectStructure = await getProjectStructure(projectPath);
    const messages: LLMMessage[] = [
        {
            role: 'system',
            content: FolderExtractorPrompt,
        },
        {
            role: 'system',
            content: "FOLDER STRUCTURE:\n" + JSON.stringify(projectStructure),
        },
        {
            role: 'user',
            content: "ERROR: " + JSON.stringify(issue)
        }
    ]

    const response = await run(messages, fileListContract);

    const fileContents: { path: string; content: string }[] = [];
    for (const filePath of response.files) {
        try {
            const content = await readProjectFile(path.join(projectPath, filePath));
            fileContents.push({ path: filePath, content });
        } catch (error) {
            console.error(`Failed to read file ${filePath}:`, error);
        }
    }

    if (fileContents.length === 0) {
        console.log("No relevant files could be read to fix the issue.");
        return;
    }

    const fixMessages: LLMMessage[] = [
        {
            role: 'system',
            content: ISSUE_FIXER_PROMPT,
        },
        {
            role: 'user',
            content: JSON.stringify({
                error: issue,
                files: fileContents
            })
        }
    ];

    const fixResponse = await run(fixMessages, fixContract);

    if (fixResponse.path && fixResponse.code) {
        const fullPath = path.join(projectPath, fixResponse.path);
        console.log(`Writing corrected file to: ${fullPath}`);
        await writeProjectFile(fullPath, fixResponse.code);
    } else {
        console.log("LLM did not return a valid file path and code to fix the issue.");
    }
}