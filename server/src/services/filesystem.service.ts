import { 
    mkdir,
    readFile,
    writeFile,
} from "node:fs/promises"
import { dirname } from "node:path"
import { exec } from "node:child_process";
import { promisify } from "node:util";




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