import fs from "node:fs/promises";
import path from "node:path"

import type { ProjectStructure } from "../types/project.types.js";

import SandboxService from "./k8s/sandbox.service.js";
import kubernetesService from "./k8s/kubernetes.service.js";



export const initReactProject = async (
    podName: string,
    path: string
) => {
    console.log("initializing react prj")

    await kubernetesService.executeCommand(
        podName,
        [
            "npx",
            "create",
            "vite@latest",
            path,
            "--",
            "--template",
            "react-ts"
        ]
    );

    await kubernetesService.executeCommand(
        podName,
        ["npm", "install"],
    );
}


export const createDirectory = async(
    podName: string,
    directoryPath: string
) => {
    await SandboxService.createDirectory(
        podName,
        directoryPath
    );
}


export const writeProjectFile = async(
    podName: string,
    path: string,
    content: string
) => {
    return await SandboxService.writeFile(
        podName,
        path,
        content
    )
}


export const readProjectFile = async(
    podName: string,
    path: string
) => {
    return await SandboxService.readFile(
        podName,
        path
    )
}



export async function getProjectStructure(
    projectPath: string
): Promise<ProjectStructure> {

    const entries = await fs.readdir(projectPath, {
        withFileTypes: true
    });
    const IGNORED_DIRECTORIES = new Set([
        "node_modules",
        ".git",
        "dist",
        "build",
        ".vite",
    ]);

    const children: ProjectStructure[] = [];

    for(const entry of entries){
        const entryPath = path.join(projectPath, entry.name);

        if(entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)){
            continue;
        }
        else{
            if(entry.isDirectory()){
                // for each folder, recursively calling same function to get its files
                const directory = await getProjectStructure(entryPath)
                
                children.push({
                    name: entry.name,
                    type: "directory",
                    children: directory.children,
                })
            }
            else{
                children.push({
                    name: entry.name,
                    type: "file"
                })
            }
        }
    }

    return{
        name: path.basename(projectPath),
        type: "directory",
        children,
    }
}