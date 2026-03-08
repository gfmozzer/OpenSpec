import type { FlowMode, Scale } from './types.js';
export declare class SddInsightCommand {
    execute(projectRoot: string, text: string, options?: {
        title?: string;
        render?: boolean;
    }): Promise<{
        id: string;
        title: string;
        filePath: string;
    }>;
}
export declare class SddDebateCommand {
    execute(projectRoot: string, insightId: string, options?: {
        title?: string;
        render?: boolean;
        agent?: string;
    }): Promise<{
        id: string;
        title: string;
        filePath: string;
    }>;
}
export declare class SddDecideCommand {
    execute(projectRoot: string, debateId: string, outcome: 'radar' | 'discard', options?: {
        title?: string;
        rationale?: string;
        render?: boolean;
    }): Promise<{
        outcome: "discard";
        debateId: string;
        discardPath: string;
        radarId?: undefined;
        radarPath?: undefined;
    } | {
        outcome: "radar";
        debateId: string;
        radarId: string;
        radarPath: string;
        discardPath?: undefined;
    }>;
}
export declare class SddBreakdownCommand {
    execute(projectRoot: string, radarId: string, options?: {
        titles?: string[];
        scale?: Scale;
        mode?: 'graph' | 'flat';
        incremental?: boolean;
        dedupe?: 'strict' | 'normal' | 'off';
        render?: boolean;
    }): Promise<{
        radarId: string;
        created: string[];
        linked_existing: string[];
        rewired_dependencies: {
            feature_id: string;
            added_blocked_by: string[];
        }[];
        skipped_duplicates: {
            title: string;
            existing_feature_id: string;
        }[];
    }>;
}
export declare class SddStartCommand {
    execute(projectRoot: string, refOrText: string, options?: {
        scale?: Scale;
        render?: boolean;
        schema?: string;
        force?: boolean;
        flowMode?: FlowMode;
    }): Promise<{
        featureId: string;
        changeName: string;
        status: "IN_PROGRESS";
        start_guardrails: {
            blocked_check: {
                ok: boolean;
                unresolved: string[];
            };
            lock_check: {
                ok: boolean;
                conflicts: string[];
            };
            forced: boolean;
        };
        active_path: string;
        generated_docs: string[];
        recommended_bundles: string[];
        handoff_seed_refs: string[];
        flow_mode: "direto" | "padrao" | "rigoroso";
    }>;
}
export declare class SddFinalizeCommand {
    execute(projectRoot: string, options?: {
        ref?: string;
        allReady?: boolean;
        render?: boolean;
        noAdr?: boolean;
    }): Promise<{
        finalized: never[];
        unblocked: never[];
        pending: number;
        updated_core_docs?: undefined;
        updated_readme?: undefined;
        updated_agent_guide?: undefined;
        doc_warnings?: undefined;
    } | {
        finalized: string[];
        unblocked: string[];
        pending: number;
        updated_core_docs: string[];
        updated_readme: boolean;
        updated_agent_guide: boolean;
        doc_warnings: string[];
    }>;
}
export declare class SddContextCommand {
    execute(projectRoot: string, ref: string): Promise<{
        context_pack_version: number;
        target_id: string;
        target_type: "FEAT";
        summary: string;
        origin: {
            type: "radar" | "direct" | "fast_track" | "frontend_gap" | "tech_debt";
            ref: string;
        };
        related_discovery: string[];
        related_gaps: string[];
        recommended_skills: string[];
        recommended_bundles: string[];
        change_name: string;
        blocked_by: string[];
        lock_domains: string[];
        parallel_group: string | undefined;
        planning_mode: "local_plan" | "direct_tasks";
        flow_mode: "direto" | "padrao" | "rigoroso";
        current_stage: "proposta" | "planejamento" | "tarefas" | "execucao" | "consolidacao";
        gates: {
            proposta: {
                status: "nao_exigida" | "rascunho" | "pronta" | "aprovada";
                approved_at?: string | undefined;
                approved_by?: string | undefined;
                note?: string | undefined;
            };
            planejamento: {
                status: "nao_exigida" | "rascunho" | "pronta" | "aprovada";
                approved_at?: string | undefined;
                approved_by?: string | undefined;
                note?: string | undefined;
            };
            tarefas: {
                status: "nao_exigida" | "rascunho" | "pronta" | "aprovada";
                approved_at?: string | undefined;
                approved_by?: string | undefined;
                note?: string | undefined;
            };
        };
        next_action: string;
        execution_kind: "documentation" | "feature" | "infra" | "migration" | "frontend_coverage";
        produces: string[];
        consumes: string[];
        predecessor_outputs: {
            feature_id: string;
            status: "ARCHIVED" | "READY" | "IN_PROGRESS" | "DONE" | "BLOCKED" | "SYNC_REQUIRED" | "VERIFY_FAILED";
            produces: string[];
            summary: string;
        }[];
        relevant_adrs: string[];
        relevant_services: {
            id: string;
            name: string;
            contracts: string[];
        }[];
        relevant_contracts: string[];
        relevant_frontend_decisions: {
            id: string;
            title: string;
            status: "APPROVED" | "DISCARDED" | "SUPERSEDED" | "PROPOSED";
            route_refs: string[];
        }[];
        read_order: string[];
        active_path: string;
        unresolved_blocked_by: string[];
        lock_conflicts_with: string[];
        readiness: "READY" | "BLOCKED" | "LOCK_CONFLICT";
        core_docs: string[];
        related_features?: undefined;
        related_debates?: undefined;
        source_feature?: undefined;
        resolved_by_feature?: undefined;
        routes?: undefined;
        related_refs?: undefined;
    } | {
        context_pack_version: number;
        target_id: string;
        target_type: "RAD";
        summary: string;
        related_features: string[];
        related_debates: string[];
        read_order: string[];
        core_docs: string[];
        origin?: undefined;
        related_discovery?: undefined;
        related_gaps?: undefined;
        recommended_skills?: undefined;
        recommended_bundles?: undefined;
        change_name?: undefined;
        blocked_by?: undefined;
        lock_domains?: undefined;
        parallel_group?: undefined;
        planning_mode?: undefined;
        flow_mode?: undefined;
        current_stage?: undefined;
        gates?: undefined;
        next_action?: undefined;
        execution_kind?: undefined;
        produces?: undefined;
        consumes?: undefined;
        predecessor_outputs?: undefined;
        relevant_adrs?: undefined;
        relevant_services?: undefined;
        relevant_contracts?: undefined;
        relevant_frontend_decisions?: undefined;
        active_path?: undefined;
        unresolved_blocked_by?: undefined;
        lock_conflicts_with?: undefined;
        readiness?: undefined;
        source_feature?: undefined;
        resolved_by_feature?: undefined;
        routes?: undefined;
        related_refs?: undefined;
    } | {
        context_pack_version: number;
        target_id: string;
        target_type: "FGAP";
        summary: string;
        source_feature: string;
        resolved_by_feature: string;
        routes: string[];
        read_order: string[];
        core_docs: string[];
        origin?: undefined;
        related_discovery?: undefined;
        related_gaps?: undefined;
        recommended_skills?: undefined;
        recommended_bundles?: undefined;
        change_name?: undefined;
        blocked_by?: undefined;
        lock_domains?: undefined;
        parallel_group?: undefined;
        planning_mode?: undefined;
        flow_mode?: undefined;
        current_stage?: undefined;
        gates?: undefined;
        next_action?: undefined;
        execution_kind?: undefined;
        produces?: undefined;
        consumes?: undefined;
        predecessor_outputs?: undefined;
        relevant_adrs?: undefined;
        relevant_services?: undefined;
        relevant_contracts?: undefined;
        relevant_frontend_decisions?: undefined;
        active_path?: undefined;
        unresolved_blocked_by?: undefined;
        lock_conflicts_with?: undefined;
        readiness?: undefined;
        related_features?: undefined;
        related_debates?: undefined;
        related_refs?: undefined;
    } | {
        context_pack_version: number;
        target_id: string;
        target_type: "TD";
        summary: string;
        related_refs: string[];
        read_order: string[];
        core_docs: string[];
        origin?: undefined;
        related_discovery?: undefined;
        related_gaps?: undefined;
        recommended_skills?: undefined;
        recommended_bundles?: undefined;
        change_name?: undefined;
        blocked_by?: undefined;
        lock_domains?: undefined;
        parallel_group?: undefined;
        planning_mode?: undefined;
        flow_mode?: undefined;
        current_stage?: undefined;
        gates?: undefined;
        next_action?: undefined;
        execution_kind?: undefined;
        produces?: undefined;
        consumes?: undefined;
        predecessor_outputs?: undefined;
        relevant_adrs?: undefined;
        relevant_services?: undefined;
        relevant_contracts?: undefined;
        relevant_frontend_decisions?: undefined;
        active_path?: undefined;
        unresolved_blocked_by?: undefined;
        lock_conflicts_with?: undefined;
        readiness?: undefined;
        related_features?: undefined;
        related_debates?: undefined;
        source_feature?: undefined;
        resolved_by_feature?: undefined;
        routes?: undefined;
    }>;
}
export declare class SddOnboardCommand {
    execute(projectRoot: string, target?: string, options?: {
        compact?: boolean;
    }): Promise<Record<string, unknown>>;
}
type ApprovalStage = 'proposta' | 'planejamento' | 'tarefas';
export declare class SddApproveCommand {
    execute(projectRoot: string, featureId: string, stage: ApprovalStage, options?: {
        by?: string;
        note?: string;
        render?: boolean;
    }): Promise<{
        feature_id: string;
        stage: ApprovalStage;
        status: "nao_exigida" | "aprovada";
        approved_at: string;
        approved_by: string;
        current_stage: "proposta" | "planejamento" | "tarefas" | "execucao" | "consolidacao";
    }>;
}
type NextRankMode = 'impact' | 'criticality' | 'fifo';
export declare class SddNextCommand {
    execute(projectRoot: string, options?: {
        rank?: NextRankMode;
        limit?: number;
    }): Promise<{
        rank: NextRankMode;
        ready: Array<{
            id: string;
            title: string;
            recommended_skills: string[];
            score: number;
            reasons: string[];
        }>;
        blocked: Array<{
            id: string;
            title: string;
            blocked_by: string[];
        }>;
        conflicts: Array<{
            id: string;
            title: string;
            lock_domains: string[];
        }>;
    }>;
}
export declare class SddSkillsSyncCommand {
    execute(projectRoot: string, options?: {
        bundles?: string[];
        all?: boolean;
        tools?: string[];
    }): Promise<{
        synced: number;
        local_synced: number;
        tools: string[];
    }>;
}
export declare class SddFrontendGapCommand {
    add(projectRoot: string, title: string, options?: {
        originFeature?: string;
        routes?: string[];
        menu?: string[];
        render?: boolean;
    }): Promise<{
        id: string;
    }>;
    resolve(projectRoot: string, gapId: string, options?: {
        feature?: string;
        files?: string[];
        routes?: string[];
        render?: boolean;
    }): Promise<{
        id: string;
        status: "DONE";
    }>;
}
export {};
//# sourceMappingURL=operations.d.ts.map