import { type BootstrapContextReport } from './bootstrap.js';
export interface SddInitOptions {
    frontendEnabled?: boolean;
    language?: 'pt-BR' | 'en-US';
    layout?: 'legacy' | 'pt-BR';
    render?: boolean;
}
export interface SddInitResult {
    projectRoot: string;
    memoryDir: string;
    frontendEnabled: boolean;
    rendered: boolean;
    skillsSeeded: number;
    localSkillsMaterialized: number;
    syncedTools: string[];
    contextBootstrap: BootstrapContextReport;
}
export interface SddInitContextOptions {
    mode?: 'merge' | 'replace';
    deep?: boolean;
    render?: boolean;
}
export interface SddInitContextResult {
    projectRoot: string;
    memoryDir: string;
    rendered: boolean;
    contextBootstrap: BootstrapContextReport;
}
export declare class SddInitCommand {
    execute(projectRoot: string, options?: SddInitOptions): Promise<SddInitResult>;
}
export declare class SddInitContextCommand {
    execute(projectRoot: string, options?: SddInitContextOptions): Promise<SddInitContextResult>;
}
//# sourceMappingURL=init.d.ts.map