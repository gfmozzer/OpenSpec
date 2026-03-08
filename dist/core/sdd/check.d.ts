export interface SddCheckOptions {
    render?: boolean;
}
export interface SddCheckReport {
    valid: boolean;
    errors: string[];
    warnings: string[];
    summary: {
        discovery: number;
        backlog: number;
        techDebt: number;
        finalizeQueue: number;
        frontendEnabled: boolean;
        frontendGaps: number;
        frontendRoutes: number;
        progress_global: {
            done: number;
            total: number;
            percent: number;
        };
        progress_by_radar: Array<{
            radar_id: string;
            done: number;
            total: number;
            percent: number;
        }>;
        ready_for_parallel: number;
        blocked: number;
        lock_conflicts: number;
        documentation_sync: boolean;
        core_views_stale: boolean;
        missing_architecture_fields: string[];
        frontend_coverage_sync: boolean;
        features_missing_frontend_declaration: string[];
        features_with_frontend_conflict: string[];
        features_missing_fgap_link: string[];
        graph: {
            readyForParallel: number;
            blocked: number;
            lockConflicts: number;
        };
    };
}
export declare class SddCheckCommand {
    execute(projectRoot: string, options?: SddCheckOptions): Promise<SddCheckReport>;
}
//# sourceMappingURL=check.d.ts.map