import { 
    mkdir,
    readFile,
    writeFile,
} from "node:fs/promises"

import { dirname } from "node:path"

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