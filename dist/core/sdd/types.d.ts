import { z } from 'zod';
export declare const ID_PATTERNS: {
    readonly insight: RegExp;
    readonly debate: RegExp;
    readonly radar: RegExp;
    readonly feature: RegExp;
    readonly frontendGap: RegExp;
    readonly techDebt: RegExp;
};
export declare const OriginTypeSchema: z.ZodEnum<{
    radar: "radar";
    direct: "direct";
    fast_track: "fast_track";
    frontend_gap: "frontend_gap";
    tech_debt: "tech_debt";
}>;
export declare const ScaleSchema: z.ZodEnum<{
    QUICK: "QUICK";
    STANDARD: "STANDARD";
    LARGE: "LARGE";
}>;
export declare const ExecutionKindSchema: z.ZodEnum<{
    documentation: "documentation";
    feature: "feature";
    infra: "infra";
    migration: "migration";
    frontend_coverage: "frontend_coverage";
}>;
export declare const PlanningModeSchema: z.ZodEnum<{
    local_plan: "local_plan";
    direct_tasks: "direct_tasks";
}>;
export declare const FlowModeSchema: z.ZodEnum<{
    direto: "direto";
    padrao: "padrao";
    rigoroso: "rigoroso";
}>;
export declare const FlowStageSchema: z.ZodEnum<{
    proposta: "proposta";
    planejamento: "planejamento";
    tarefas: "tarefas";
    execucao: "execucao";
    consolidacao: "consolidacao";
}>;
export declare const GateStatusSchema: z.ZodEnum<{
    nao_exigida: "nao_exigida";
    rascunho: "rascunho";
    pronta: "pronta";
    aprovada: "aprovada";
}>;
export declare const SourceDocumentTypeSchema: z.ZodEnum<{
    prd: "prd";
    rfc: "rfc";
    briefing: "briefing";
    historia: "historia";
    wireframe: "wireframe";
    html_mock: "html_mock";
    referencia_visual: "referencia_visual";
    entrevista: "entrevista";
    anexo: "anexo";
    legado: "legado";
    outro: "outro";
}>;
export declare const SourceDocumentStatusSchema: z.ZodEnum<{
    RAW: "RAW";
    INDEXED: "INDEXED";
    NORMALIZED: "NORMALIZED";
    PLANNED: "PLANNED";
    ARCHIVED: "ARCHIVED";
}>;
export declare const DiscoveryTypeSchema: z.ZodEnum<{
    INS: "INS";
    DEB: "DEB";
    RAD: "RAD";
}>;
export declare const DiscoveryStatusSchema: z.ZodEnum<{
    PLANNED: "PLANNED";
    NEW: "NEW";
    DEBATED: "DEBATED";
    PROMOTED: "PROMOTED";
    DROPPED: "DROPPED";
    OPEN: "OPEN";
    APPROVED: "APPROVED";
    DISCARDED: "DISCARDED";
    SUPERSEDED: "SUPERSEDED";
    READY: "READY";
    SPLIT: "SPLIT";
    IN_PROGRESS: "IN_PROGRESS";
    DONE: "DONE";
    CANCELLED: "CANCELLED";
}>;
export declare const BacklogStatusSchema: z.ZodEnum<{
    ARCHIVED: "ARCHIVED";
    READY: "READY";
    IN_PROGRESS: "IN_PROGRESS";
    DONE: "DONE";
    BLOCKED: "BLOCKED";
    SYNC_REQUIRED: "SYNC_REQUIRED";
    VERIFY_FAILED: "VERIFY_FAILED";
}>;
export declare const FrontendGapStatusSchema: z.ZodEnum<{
    PLANNED: "PLANNED";
    OPEN: "OPEN";
    SUPERSEDED: "SUPERSEDED";
    IN_PROGRESS: "IN_PROGRESS";
    DONE: "DONE";
}>;
export declare const FrontendUiStatusSchema: z.ZodEnum<{
    PLANNED: "PLANNED";
    OK: "OK";
    GAP: "GAP";
    PARTIAL: "PARTIAL";
    DEPRECATED: "DEPRECATED";
}>;
export declare const TechDebtStatusSchema: z.ZodEnum<{
    OPEN: "OPEN";
    IN_PROGRESS: "IN_PROGRESS";
    DONE: "DONE";
}>;
export declare const DiscoveryRecordSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        INS: "INS";
        DEB: "DEB";
        RAD: "RAD";
    }>;
    title: z.ZodString;
    status: z.ZodEnum<{
        PLANNED: "PLANNED";
        NEW: "NEW";
        DEBATED: "DEBATED";
        PROMOTED: "PROMOTED";
        DROPPED: "DROPPED";
        OPEN: "OPEN";
        APPROVED: "APPROVED";
        DISCARDED: "DISCARDED";
        SUPERSEDED: "SUPERSEDED";
        READY: "READY";
        SPLIT: "SPLIT";
        IN_PROGRESS: "IN_PROGRESS";
        DONE: "DONE";
        CANCELLED: "CANCELLED";
    }>;
    origin_prompt: z.ZodOptional<z.ZodString>;
    related_ids: z.ZodDefault<z.ZodArray<z.ZodString>>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const BacklogItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        ARCHIVED: "ARCHIVED";
        READY: "READY";
        IN_PROGRESS: "IN_PROGRESS";
        DONE: "DONE";
        BLOCKED: "BLOCKED";
        SYNC_REQUIRED: "SYNC_REQUIRED";
        VERIFY_FAILED: "VERIFY_FAILED";
    }>;
    origin_type: z.ZodEnum<{
        radar: "radar";
        direct: "direct";
        fast_track: "fast_track";
        frontend_gap: "frontend_gap";
        tech_debt: "tech_debt";
    }>;
    origin_ref: z.ZodOptional<z.ZodString>;
    scale: z.ZodDefault<z.ZodEnum<{
        QUICK: "QUICK";
        STANDARD: "STANDARD";
        LARGE: "LARGE";
    }>>;
    summary: z.ZodOptional<z.ZodString>;
    blocked_by: z.ZodDefault<z.ZodArray<z.ZodString>>;
    touches: z.ZodDefault<z.ZodArray<z.ZodString>>;
    lock_domains: z.ZodDefault<z.ZodArray<z.ZodString>>;
    parallel_group: z.ZodOptional<z.ZodString>;
    execution_kind: z.ZodDefault<z.ZodEnum<{
        documentation: "documentation";
        feature: "feature";
        infra: "infra";
        migration: "migration";
        frontend_coverage: "frontend_coverage";
    }>>;
    planning_mode: z.ZodDefault<z.ZodEnum<{
        local_plan: "local_plan";
        direct_tasks: "direct_tasks";
    }>>;
    flow_mode: z.ZodDefault<z.ZodEnum<{
        direto: "direto";
        padrao: "padrao";
        rigoroso: "rigoroso";
    }>>;
    current_stage: z.ZodDefault<z.ZodEnum<{
        proposta: "proposta";
        planejamento: "planejamento";
        tarefas: "tarefas";
        execucao: "execucao";
        consolidacao: "consolidacao";
    }>>;
    gates: z.ZodDefault<z.ZodObject<{
        proposta: z.ZodDefault<z.ZodObject<{
            status: z.ZodDefault<z.ZodEnum<{
                nao_exigida: "nao_exigida";
                rascunho: "rascunho";
                pronta: "pronta";
                aprovada: "aprovada";
            }>>;
            approved_at: z.ZodOptional<z.ZodString>;
            approved_by: z.ZodOptional<z.ZodString>;
            note: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        planejamento: z.ZodDefault<z.ZodObject<{
            status: z.ZodDefault<z.ZodEnum<{
                nao_exigida: "nao_exigida";
                rascunho: "rascunho";
                pronta: "pronta";
                aprovada: "aprovada";
            }>>;
            approved_at: z.ZodOptional<z.ZodString>;
            approved_by: z.ZodOptional<z.ZodString>;
            note: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        tarefas: z.ZodDefault<z.ZodObject<{
            status: z.ZodDefault<z.ZodEnum<{
                nao_exigida: "nao_exigida";
                rascunho: "rascunho";
                pronta: "pronta";
                aprovada: "aprovada";
            }>>;
            approved_at: z.ZodOptional<z.ZodString>;
            approved_by: z.ZodOptional<z.ZodString>;
            note: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    acceptance_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    produces: z.ZodDefault<z.ZodArray<z.ZodString>>;
    consumes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    priority_score: z.ZodDefault<z.ZodNumber>;
    dependency_count: z.ZodDefault<z.ZodNumber>;
    agent_role: z.ZodOptional<z.ZodString>;
    recommended_skills: z.ZodDefault<z.ZodArray<z.ZodString>>;
    change_name: z.ZodOptional<z.ZodString>;
    branch_name: z.ZodOptional<z.ZodString>;
    worktree_path: z.ZodOptional<z.ZodString>;
    frontend_gap_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    spec_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    last_sync_at: z.ZodOptional<z.ZodString>;
    archived_at: z.ZodOptional<z.ZodString>;
    done_at: z.ZodOptional<z.ZodString>;
    unblocked_at: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const TechDebtRecordSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        OPEN: "OPEN";
        IN_PROGRESS: "IN_PROGRESS";
        DONE: "DONE";
    }>>;
    description: z.ZodOptional<z.ZodString>;
    related_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const FinalizeQueueItemSchema: z.ZodObject<{
    feature_id: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        DONE: "DONE";
        PENDING: "PENDING";
    }>>;
    summary: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    completed_at: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UnblockEventSchema: z.ZodObject<{
    feature_id: z.ZodString;
    unblocked_by: z.ZodString;
    created_at: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        NEW: "NEW";
        SEEN: "SEEN";
    }>>;
}, z.core.$strip>;
export declare const SkillCatalogEntrySchema: z.ZodObject<{
    id: z.ZodString;
    source_repo: z.ZodOptional<z.ZodString>;
    source_path: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    phases: z.ZodDefault<z.ZodArray<z.ZodString>>;
    domains: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
    bundle_ids: z.ZodDefault<z.ZodArray<z.ZodString>>;
    priority: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const SkillBundleSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    skill_ids: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const SourceDocumentRecordSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        prd: "prd";
        rfc: "rfc";
        briefing: "briefing";
        historia: "historia";
        wireframe: "wireframe";
        html_mock: "html_mock";
        referencia_visual: "referencia_visual";
        entrevista: "entrevista";
        anexo: "anexo";
        legado: "legado";
        outro: "outro";
    }>;
    path: z.ZodString;
    title: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        RAW: "RAW";
        INDEXED: "INDEXED";
        NORMALIZED: "NORMALIZED";
        PLANNED: "PLANNED";
        ARCHIVED: "ARCHIVED";
    }>>;
    summary: z.ZodOptional<z.ZodString>;
    imported_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
    used_by: z.ZodDefault<z.ZodArray<z.ZodString>>;
    notes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    consolidation_targets: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const ArchitectureNodeSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    kind: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    repo_paths: z.ZodDefault<z.ZodArray<z.ZodString>>;
    depends_on: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const ServiceRecordSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    responsibility: z.ZodOptional<z.ZodString>;
    owner_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    repo_paths: z.ZodDefault<z.ZodArray<z.ZodString>>;
    contracts: z.ZodDefault<z.ZodArray<z.ZodString>>;
    external_dependencies: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const TechStackRecordSchema: z.ZodObject<{
    layer: z.ZodString;
    technology: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
    purpose: z.ZodOptional<z.ZodString>;
    constraints: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const FrontendDecisionRecordSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        APPROVED: "APPROVED";
        DISCARDED: "DISCARDED";
        SUPERSEDED: "SUPERSEDED";
        PROPOSED: "PROPOSED";
    }>>;
    decision: z.ZodOptional<z.ZodString>;
    rationale: z.ZodOptional<z.ZodString>;
    related_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    route_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    adr_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const RepoMapRecordSchema: z.ZodObject<{
    path: z.ZodString;
    kind: z.ZodString;
    service_ref: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const FrontendGapRecordSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        PLANNED: "PLANNED";
        OPEN: "OPEN";
        SUPERSEDED: "SUPERSEDED";
        IN_PROGRESS: "IN_PROGRESS";
        DONE: "DONE";
    }>;
    origin_feature: z.ZodOptional<z.ZodString>;
    backend_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    frontend_scope: z.ZodOptional<z.ZodString>;
    route_targets: z.ZodDefault<z.ZodArray<z.ZodString>>;
    menu_targets: z.ZodDefault<z.ZodArray<z.ZodString>>;
    suggested_files: z.ZodDefault<z.ZodArray<z.ZodString>>;
    implemented_files: z.ZodDefault<z.ZodArray<z.ZodString>>;
    resolved_by_feature: z.ZodOptional<z.ZodString>;
    related_route_ids: z.ZodDefault<z.ZodArray<z.ZodString>>;
    notes: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const FrontendRouteRecordSchema: z.ZodObject<{
    id: z.ZodString;
    path: z.ZodString;
    parent_id: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    nav_surface: z.ZodOptional<z.ZodString>;
    ui_status: z.ZodEnum<{
        PLANNED: "PLANNED";
        OK: "OK";
        GAP: "GAP";
        PARTIAL: "PARTIAL";
        DEPRECATED: "DEPRECATED";
    }>;
    source_gap_ids: z.ZodDefault<z.ZodArray<z.ZodString>>;
    implemented_files: z.ZodDefault<z.ZodArray<z.ZodString>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const DiscoveryIndexStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    counters: z.ZodDefault<z.ZodObject<{
        INS: z.ZodDefault<z.ZodNumber>;
        DEB: z.ZodDefault<z.ZodNumber>;
        RAD: z.ZodDefault<z.ZodNumber>;
        FEAT: z.ZodDefault<z.ZodNumber>;
        FGAP: z.ZodDefault<z.ZodNumber>;
        TD: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    records: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<{
            INS: "INS";
            DEB: "DEB";
            RAD: "RAD";
        }>;
        title: z.ZodString;
        status: z.ZodEnum<{
            PLANNED: "PLANNED";
            NEW: "NEW";
            DEBATED: "DEBATED";
            PROMOTED: "PROMOTED";
            DROPPED: "DROPPED";
            OPEN: "OPEN";
            APPROVED: "APPROVED";
            DISCARDED: "DISCARDED";
            SUPERSEDED: "SUPERSEDED";
            READY: "READY";
            SPLIT: "SPLIT";
            IN_PROGRESS: "IN_PROGRESS";
            DONE: "DONE";
            CANCELLED: "CANCELLED";
        }>;
        origin_prompt: z.ZodOptional<z.ZodString>;
        related_ids: z.ZodDefault<z.ZodArray<z.ZodString>>;
        created_at: z.ZodOptional<z.ZodString>;
        updated_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const BacklogStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            ARCHIVED: "ARCHIVED";
            READY: "READY";
            IN_PROGRESS: "IN_PROGRESS";
            DONE: "DONE";
            BLOCKED: "BLOCKED";
            SYNC_REQUIRED: "SYNC_REQUIRED";
            VERIFY_FAILED: "VERIFY_FAILED";
        }>;
        origin_type: z.ZodEnum<{
            radar: "radar";
            direct: "direct";
            fast_track: "fast_track";
            frontend_gap: "frontend_gap";
            tech_debt: "tech_debt";
        }>;
        origin_ref: z.ZodOptional<z.ZodString>;
        scale: z.ZodDefault<z.ZodEnum<{
            QUICK: "QUICK";
            STANDARD: "STANDARD";
            LARGE: "LARGE";
        }>>;
        summary: z.ZodOptional<z.ZodString>;
        blocked_by: z.ZodDefault<z.ZodArray<z.ZodString>>;
        touches: z.ZodDefault<z.ZodArray<z.ZodString>>;
        lock_domains: z.ZodDefault<z.ZodArray<z.ZodString>>;
        parallel_group: z.ZodOptional<z.ZodString>;
        execution_kind: z.ZodDefault<z.ZodEnum<{
            documentation: "documentation";
            feature: "feature";
            infra: "infra";
            migration: "migration";
            frontend_coverage: "frontend_coverage";
        }>>;
        planning_mode: z.ZodDefault<z.ZodEnum<{
            local_plan: "local_plan";
            direct_tasks: "direct_tasks";
        }>>;
        flow_mode: z.ZodDefault<z.ZodEnum<{
            direto: "direto";
            padrao: "padrao";
            rigoroso: "rigoroso";
        }>>;
        current_stage: z.ZodDefault<z.ZodEnum<{
            proposta: "proposta";
            planejamento: "planejamento";
            tarefas: "tarefas";
            execucao: "execucao";
            consolidacao: "consolidacao";
        }>>;
        gates: z.ZodDefault<z.ZodObject<{
            proposta: z.ZodDefault<z.ZodObject<{
                status: z.ZodDefault<z.ZodEnum<{
                    nao_exigida: "nao_exigida";
                    rascunho: "rascunho";
                    pronta: "pronta";
                    aprovada: "aprovada";
                }>>;
                approved_at: z.ZodOptional<z.ZodString>;
                approved_by: z.ZodOptional<z.ZodString>;
                note: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            planejamento: z.ZodDefault<z.ZodObject<{
                status: z.ZodDefault<z.ZodEnum<{
                    nao_exigida: "nao_exigida";
                    rascunho: "rascunho";
                    pronta: "pronta";
                    aprovada: "aprovada";
                }>>;
                approved_at: z.ZodOptional<z.ZodString>;
                approved_by: z.ZodOptional<z.ZodString>;
                note: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            tarefas: z.ZodDefault<z.ZodObject<{
                status: z.ZodDefault<z.ZodEnum<{
                    nao_exigida: "nao_exigida";
                    rascunho: "rascunho";
                    pronta: "pronta";
                    aprovada: "aprovada";
                }>>;
                approved_at: z.ZodOptional<z.ZodString>;
                approved_by: z.ZodOptional<z.ZodString>;
                note: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        acceptance_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        produces: z.ZodDefault<z.ZodArray<z.ZodString>>;
        consumes: z.ZodDefault<z.ZodArray<z.ZodString>>;
        priority_score: z.ZodDefault<z.ZodNumber>;
        dependency_count: z.ZodDefault<z.ZodNumber>;
        agent_role: z.ZodOptional<z.ZodString>;
        recommended_skills: z.ZodDefault<z.ZodArray<z.ZodString>>;
        change_name: z.ZodOptional<z.ZodString>;
        branch_name: z.ZodOptional<z.ZodString>;
        worktree_path: z.ZodOptional<z.ZodString>;
        frontend_gap_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        spec_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        last_sync_at: z.ZodOptional<z.ZodString>;
        archived_at: z.ZodOptional<z.ZodString>;
        done_at: z.ZodOptional<z.ZodString>;
        unblocked_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const TechDebtStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<{
            OPEN: "OPEN";
            IN_PROGRESS: "IN_PROGRESS";
            DONE: "DONE";
        }>>;
        description: z.ZodOptional<z.ZodString>;
        related_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        created_at: z.ZodOptional<z.ZodString>;
        updated_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const FinalizeQueueStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        feature_id: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<{
            DONE: "DONE";
            PENDING: "PENDING";
        }>>;
        summary: z.ZodOptional<z.ZodString>;
        created_at: z.ZodOptional<z.ZodString>;
        completed_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const UnblockEventsStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    events: z.ZodDefault<z.ZodArray<z.ZodObject<{
        feature_id: z.ZodString;
        unblocked_by: z.ZodString;
        created_at: z.ZodOptional<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<{
            NEW: "NEW";
            SEEN: "SEEN";
        }>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const SkillCatalogStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    skills: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        source_repo: z.ZodOptional<z.ZodString>;
        source_path: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        phases: z.ZodDefault<z.ZodArray<z.ZodString>>;
        domains: z.ZodDefault<z.ZodArray<z.ZodString>>;
        tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
        bundle_ids: z.ZodDefault<z.ZodArray<z.ZodString>>;
        priority: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>>;
    bundles: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        skill_ids: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const SourceIndexStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    sources: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<{
            prd: "prd";
            rfc: "rfc";
            briefing: "briefing";
            historia: "historia";
            wireframe: "wireframe";
            html_mock: "html_mock";
            referencia_visual: "referencia_visual";
            entrevista: "entrevista";
            anexo: "anexo";
            legado: "legado";
            outro: "outro";
        }>;
        path: z.ZodString;
        title: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<{
            RAW: "RAW";
            INDEXED: "INDEXED";
            NORMALIZED: "NORMALIZED";
            PLANNED: "PLANNED";
            ARCHIVED: "ARCHIVED";
        }>>;
        summary: z.ZodOptional<z.ZodString>;
        imported_at: z.ZodOptional<z.ZodString>;
        updated_at: z.ZodOptional<z.ZodString>;
        used_by: z.ZodDefault<z.ZodArray<z.ZodString>>;
        notes: z.ZodDefault<z.ZodArray<z.ZodString>>;
        consolidation_targets: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const FrontendGapsStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            PLANNED: "PLANNED";
            OPEN: "OPEN";
            SUPERSEDED: "SUPERSEDED";
            IN_PROGRESS: "IN_PROGRESS";
            DONE: "DONE";
        }>;
        origin_feature: z.ZodOptional<z.ZodString>;
        backend_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        frontend_scope: z.ZodOptional<z.ZodString>;
        route_targets: z.ZodDefault<z.ZodArray<z.ZodString>>;
        menu_targets: z.ZodDefault<z.ZodArray<z.ZodString>>;
        suggested_files: z.ZodDefault<z.ZodArray<z.ZodString>>;
        implemented_files: z.ZodDefault<z.ZodArray<z.ZodString>>;
        resolved_by_feature: z.ZodOptional<z.ZodString>;
        related_route_ids: z.ZodDefault<z.ZodArray<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
        created_at: z.ZodOptional<z.ZodString>;
        updated_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const FrontendMapStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    routes: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        path: z.ZodString;
        parent_id: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        nav_surface: z.ZodOptional<z.ZodString>;
        ui_status: z.ZodEnum<{
            PLANNED: "PLANNED";
            OK: "OK";
            GAP: "GAP";
            PARTIAL: "PARTIAL";
            DEPRECATED: "DEPRECATED";
        }>;
        source_gap_ids: z.ZodDefault<z.ZodArray<z.ZodString>>;
        implemented_files: z.ZodDefault<z.ZodArray<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const ArchitectureStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    nodes: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        kind: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        repo_paths: z.ZodDefault<z.ZodArray<z.ZodString>>;
        depends_on: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const ServiceCatalogStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    services: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        responsibility: z.ZodOptional<z.ZodString>;
        owner_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        repo_paths: z.ZodDefault<z.ZodArray<z.ZodString>>;
        contracts: z.ZodDefault<z.ZodArray<z.ZodString>>;
        external_dependencies: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const TechStackStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        layer: z.ZodString;
        technology: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        purpose: z.ZodOptional<z.ZodString>;
        constraints: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const IntegrationContractsStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    contracts: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const FrontendDecisionsStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<{
            APPROVED: "APPROVED";
            DISCARDED: "DISCARDED";
            SUPERSEDED: "SUPERSEDED";
            PROPOSED: "PROPOSED";
        }>>;
        decision: z.ZodOptional<z.ZodString>;
        rationale: z.ZodOptional<z.ZodString>;
        related_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        route_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        adr_refs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const RepoMapStateSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        kind: z.ZodString;
        service_ref: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type OriginType = z.infer<typeof OriginTypeSchema>;
export type Scale = z.infer<typeof ScaleSchema>;
export type ExecutionKind = z.infer<typeof ExecutionKindSchema>;
export type PlanningMode = z.infer<typeof PlanningModeSchema>;
export type FlowMode = z.infer<typeof FlowModeSchema>;
export type FlowStage = z.infer<typeof FlowStageSchema>;
export type GateStatus = z.infer<typeof GateStatusSchema>;
export type DiscoveryRecord = z.infer<typeof DiscoveryRecordSchema>;
export type BacklogItem = z.infer<typeof BacklogItemSchema>;
export type TechDebtRecord = z.infer<typeof TechDebtRecordSchema>;
export type FinalizeQueueItem = z.infer<typeof FinalizeQueueItemSchema>;
export type UnblockEvent = z.infer<typeof UnblockEventSchema>;
export type SkillCatalogEntry = z.infer<typeof SkillCatalogEntrySchema>;
export type SkillBundle = z.infer<typeof SkillBundleSchema>;
export type SourceDocumentRecord = z.infer<typeof SourceDocumentRecordSchema>;
export type ArchitectureNode = z.infer<typeof ArchitectureNodeSchema>;
export type ServiceRecord = z.infer<typeof ServiceRecordSchema>;
export type TechStackRecord = z.infer<typeof TechStackRecordSchema>;
export type FrontendDecisionRecord = z.infer<typeof FrontendDecisionRecordSchema>;
export type RepoMapRecord = z.infer<typeof RepoMapRecordSchema>;
export type FrontendGapRecord = z.infer<typeof FrontendGapRecordSchema>;
export type FrontendRouteRecord = z.infer<typeof FrontendRouteRecordSchema>;
export type DiscoveryIndexState = z.infer<typeof DiscoveryIndexStateSchema>;
export type BacklogState = z.infer<typeof BacklogStateSchema>;
export type TechDebtState = z.infer<typeof TechDebtStateSchema>;
export type FinalizeQueueState = z.infer<typeof FinalizeQueueStateSchema>;
export type UnblockEventsState = z.infer<typeof UnblockEventsStateSchema>;
export type SkillCatalogState = z.infer<typeof SkillCatalogStateSchema>;
export type SourceIndexState = z.infer<typeof SourceIndexStateSchema>;
export type FrontendGapsState = z.infer<typeof FrontendGapsStateSchema>;
export type FrontendMapState = z.infer<typeof FrontendMapStateSchema>;
export type ArchitectureState = z.infer<typeof ArchitectureStateSchema>;
export type ServiceCatalogState = z.infer<typeof ServiceCatalogStateSchema>;
export type TechStackState = z.infer<typeof TechStackStateSchema>;
export type IntegrationContractsState = z.infer<typeof IntegrationContractsStateSchema>;
export type FrontendDecisionsState = z.infer<typeof FrontendDecisionsStateSchema>;
export type RepoMapState = z.infer<typeof RepoMapStateSchema>;
//# sourceMappingURL=types.d.ts.map