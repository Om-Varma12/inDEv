import fs from "node:fs/promises";
import path from "node:path"

import type { ProjectStructure } from "../types/project.types.js";
import kubernetesService from "./k8s/kubernetes.service.js";
import SandboxService from "./k8s/sandbox.service.js";


export const initReactProject = async (
    podName: string,
    projectPath: string
) => {
    console.log("initializing react prj in pod")
    const dirName = path.dirname(projectPath);
    const prjName = path.basename(projectPath);

    await kubernetesService.executeCommand(podName, ["mkdir", "-p", dirName]);

    console.log("running npm create vite in pod");
    await kubernetesService.executeCommand(
        podName,
        [
            "npx",
            "--yes",
            "create-vite@latest",
            projectPath,
            "--",
            "--template",
            "react-ts"
        ]
    );

    console.log("installing pkgs in pod");
    await kubernetesService.executeCommand(
        podName,
        [
            "/bin/bash",
            "-c",
            `cd ${projectPath} && npm install`
        ]
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
    podName: string,
    projectPath: string
): Promise<ProjectStructure> {
    const nodeScript = `
const fs = require('fs');
const path = require('path');

function getStructure(dir) {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const IGNORED = new Set(["node_modules", ".git", "dist", "build", ".vite"]);
        const children = [];
        for (const entry of entries) {
            if (entry.isDirectory() && IGNORED.has(entry.name)) continue;
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                children.push({
                    name: entry.name,
                    type: "directory",
                    children: getStructure(entryPath)
                });
            } else {
                children.push({
                    name: entry.name,
                    type: "file"
                });
            }
        }
        return children;
    } catch (e) {
        return [];
    }
}

const structure = {
    name: path.basename('${projectPath}'),
    type: "directory",
    children: getStructure('${projectPath}')
};
console.log(JSON.stringify(structure));
`;

    const output = await kubernetesService.executeCommand(podName, [
        "node",
        "-e",
        nodeScript
    ]);
    try {
        return JSON.parse(output.trim());
    } catch (e) {
        console.error("Failed to parse remote project structure:", output, e);
        return {
            name: path.basename(projectPath),
            type: "directory",
            children: []
        };
    }
}