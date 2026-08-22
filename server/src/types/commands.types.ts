export interface CommandResult{
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    success: boolean;
}