import { 
    mkdir,
    readFile,
    writeFile,
} from "node:fs/promises"
import fs from "node:fs/promises";
import { dirname } from "node:path"
import path from "node:path"
import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { ProjectStructure } from "../types/project.types.js";




const execAsync = promisify(exec);

export const initReactProject = async (path: string) => {
    console.log("initializing react prj")
    await execAsync(
        `npm create vite@latest "${path}" -- --template react-ts`
    )
    
    console.log("installing pkgs")
    await execAsync("npm i", {
        cwd: path
    })
}


export const createDirectory = async(path: string) => {
    await mkdir(path, { recursive: true})
}


export const writeProjectFile = async(
    path: string,
    content: string
) => {
    await mkdir(dirname(path), {
        recursive: true
    })

    await writeFile(
        path,
        content,
        "utf-8"
    )
}


export const readProjectFile = async(
    path: string
) => {
    return await readFile(
        path,
        "utf-8"
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