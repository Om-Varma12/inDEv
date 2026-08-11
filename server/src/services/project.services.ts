import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const initReactProject = async (path: string) => {
    await execAsync(
        `npm create vite@latest "${path}" -- --template react-ts`
    )

    await execAsync("npm i", {
        cwd: path
    })
}