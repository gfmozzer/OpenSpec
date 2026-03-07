import type { SddPaths, SddRuntimeConfig } from './state.js';
export type BootstrapMode = 'empty-only' | 'merge' | 'replace';
export interface BootstrapContextOptions {
    mode?: BootstrapMode;
    deep?: boolean;
}
export interface BootstrapContextReport {
    mode: BootstrapMode;
    deep: boolean;
    detected: {
        package_name: string;
        tech_stack_count: number;
        repo_map_count: number;
        architecture_nodes_count: number;
        service_catalog_count: number;
        integration_contracts_count: number;
    };
    updated: {
        tech_stack: boolean;
        repo_map: boolean;
        architecture: boolean;
        service_catalog: boolean;
        integration_contracts: boolean;
    };
    notes: string[];
}
export declare function bootstrapInitialContext(projectRoot: string, paths: SddPaths, config: SddRuntimeConfig, options?: BootstrapContextOptions): Promise<BootstrapContextReport>;
//# sourceMappingURL=bootstrap.d.ts.map