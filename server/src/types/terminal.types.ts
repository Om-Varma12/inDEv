export interface TerminalCreateMessage{
    type: "create"
}

export interface TerminalClientMessage{
    type: "create"
}

export interface TerminalServerMessage{
    type: "creating" | "ready" | "error",
    podName?: string,
    message?: string,
}