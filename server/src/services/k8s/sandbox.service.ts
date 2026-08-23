import kubernetesService from "./kubernetes.service.js";


class SandboxService{
    async createProject(
        podName: string,
        projectName: string,
    ){
        await kubernetesService.executeCommand(
            podName,
            ["mkdir", "-p", `/workspace/${projectName}`]
        );
    }
    

    async createDirectory(
        podName: string,
        projectPath: string
    ){
        await kubernetesService.executeCommand(
            podName,
            ["mkdir", "-p", projectPath]
        );
    }


    async writeFile(
        podName: string,
        filePath: string,
        content: string
    ){
        await kubernetesService.executeCommand(
            podName,
            ["sh", "-c", `echo "${content}" > ${filePath}`]
        );
    }


    async readFile(
        podName: string,
        filePath: string
    ){
        return await kubernetesService.executeCommand(
            podName,
            ["cat", filePath]
        );
    }
}



export default new SandboxService();