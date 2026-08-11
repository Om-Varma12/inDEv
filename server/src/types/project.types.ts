export interface ProjectStructure {
    structure: StructureItem[];
    modifiedFiles: ModifiedFile[];
    missingDependencies: MissingDependency[];
    notes: string[];
}

export interface StructureItem {
    path: string;
    type: "file" | "folder";
    action: "create" | "modify" | "delete";
    description: string;
    exports?: ExportInfo[];
    imports?: ImportInfo[];
}

export interface ExportInfo {
    name: string;
    type: "named" | "default";
    reExportFrom?: string;
}

export interface ImportInfo {
    source: string;
    type: "named" | "default";
    names: string[];
}

export interface ModifiedFile {
    path: string;
    action: "modify";
    description: string;
    addedImports?: ImportInfo[];
    reason?: string;
}

export interface MissingDependency {
    package: string;
    reason: string;
}