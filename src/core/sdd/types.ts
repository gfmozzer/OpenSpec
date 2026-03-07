import { z } from 'zod';

// Core ID patterns
export const ID_PATTERNS = {
  insight: /^INS-\d{3,}$/,
  debate: /^DEB-\d{3,}$/,
  radar: /^RAD-\d{3,}$/,
  feature: /^FEAT-\d{3,}$/,
  frontendGap: /^FGAP-\d{3,}$/,
  techDebt: /^TD-\d{3,}$/,
} as const;

export const OriginTypeSchema = z.enum([
  'radar',
  'direct',
  'fast_track',
  'frontend_gap',
  'tech_debt',
]);

export const ScaleSchema = z.enum(['QUICK', 'STANDARD', 'LARGE']);
export const ExecutionKindSchema = z.enum([
  'feature',
  'infra',
  'migration',
  'frontend_coverage',
  'documentation',
]);
export const PlanningModeSchema = z.enum(['local_plan', 'direct_tasks']);

export const DiscoveryTypeSchema = z.enum(['INS', 'DEB', 'RAD']);
export const DiscoveryStatusSchema = z.enum([
  'NEW',
  'DEBATED',
  'PROMOTED',
  'DROPPED',
  'OPEN',
  'APPROVED',
  'DISCARDED',
  'SUPERSEDED',
  'READY',
  'PLANNED',
  'SPLIT',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED',
]);

export const BacklogStatusSchema = z.enum([
  'READY',
  'BLOCKED',
  'IN_PROGRESS',
  'SYNC_REQUIRED',
  'VERIFY_FAILED',
  'ARCHIVED',
  'DONE',
]);

export const FrontendGapStatusSchema = z.enum([
  'OPEN',
  'PLANNED',
  'IN_PROGRESS',
  'DONE',
  'SUPERSEDED',
]);

export const FrontendUiStatusSchema = z.enum([
  'OK',
  'GAP',
  'PLANNED',
  'PARTIAL',
  'DEPRECATED',
]);

export const TechDebtStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'DONE']);

const NullableStringSchema = z.string().optional();
const StringArraySchema = z.array(z.string()).default([]);

export const DiscoveryRecordSchema = z
  .object({
    id: z.string().min(1),
    type: DiscoveryTypeSchema,
    title: z.string().min(1),
    status: DiscoveryStatusSchema,
    origin_prompt: NullableStringSchema,
    related_ids: StringArraySchema,
    created_at: NullableStringSchema,
    updated_at: NullableStringSchema,
  })
  .superRefine((record, ctx) => {
    const expectedPrefix = `${record.type}-`;
    if (!record.id.startsWith(expectedPrefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Discovery record id "${record.id}" must start with "${expectedPrefix}"`,
      });
    }
  });

export const BacklogItemSchema = z.object({
  id: z.string().regex(ID_PATTERNS.feature, 'Invalid FEAT id format'),
  title: z.string().min(1),
  status: BacklogStatusSchema,
  origin_type: OriginTypeSchema,
  origin_ref: NullableStringSchema,
  scale: ScaleSchema.default('STANDARD'),
  summary: NullableStringSchema,
  blocked_by: StringArraySchema,
  touches: StringArraySchema,
  lock_domains: StringArraySchema,
  parallel_group: NullableStringSchema,
  execution_kind: ExecutionKindSchema.default('feature'),
  planning_mode: PlanningModeSchema.default('local_plan'),
  acceptance_refs: StringArraySchema,
  produces: StringArraySchema,
  consumes: StringArraySchema,
  priority_score: z.number().default(0),
  dependency_count: z.number().int().nonnegative().default(0),
  agent_role: NullableStringSchema,
  recommended_skills: StringArraySchema,
  change_name: NullableStringSchema,
  branch_name: NullableStringSchema,
  worktree_path: NullableStringSchema,
  frontend_gap_refs: StringArraySchema,
  spec_refs: StringArraySchema,
  last_sync_at: NullableStringSchema,
  archived_at: NullableStringSchema,
  done_at: NullableStringSchema,
  unblocked_at: NullableStringSchema,
});

export const TechDebtRecordSchema = z.object({
  id: z.string().regex(ID_PATTERNS.techDebt, 'Invalid TD id format'),
  title: z.string().min(1),
  status: TechDebtStatusSchema.default('OPEN'),
  description: NullableStringSchema,
  related_refs: StringArraySchema,
  created_at: NullableStringSchema,
  updated_at: NullableStringSchema,
});

export const FinalizeQueueItemSchema = z.object({
  feature_id: z.string().regex(ID_PATTERNS.feature, 'Invalid FEAT id format'),
  status: z.enum(['PENDING', 'DONE']).default('PENDING'),
  summary: NullableStringSchema,
  created_at: NullableStringSchema,
  completed_at: NullableStringSchema,
});

export const UnblockEventSchema = z.object({
  feature_id: z.string().regex(ID_PATTERNS.feature, 'Invalid FEAT id format'),
  unblocked_by: z.string().regex(ID_PATTERNS.feature, 'Invalid FEAT id format'),
  created_at: NullableStringSchema,
  status: z.enum(['NEW', 'SEEN']).default('NEW'),
});

export const SkillCatalogEntrySchema = z.object({
  id: z.string().min(1),
  source_repo: NullableStringSchema,
  source_path: NullableStringSchema,
  title: z.string().min(1),
  description: NullableStringSchema,
  phases: StringArraySchema,
  domains: StringArraySchema,
  tools: StringArraySchema,
  bundle_ids: StringArraySchema,
  priority: z.number().int().nonnegative().default(0),
});

export const SkillBundleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  skill_ids: StringArraySchema,
});

export const ArchitectureNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.string().min(1),
  description: NullableStringSchema,
  repo_paths: StringArraySchema,
  depends_on: StringArraySchema,
});

export const ServiceRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  responsibility: NullableStringSchema,
  owner_refs: StringArraySchema,
  repo_paths: StringArraySchema,
  contracts: StringArraySchema,
  external_dependencies: StringArraySchema,
});

export const TechStackRecordSchema = z.object({
  layer: z.string().min(1),
  technology: z.string().min(1),
  version: NullableStringSchema,
  purpose: NullableStringSchema,
  constraints: StringArraySchema,
});

export const FrontendDecisionRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['PROPOSED', 'APPROVED', 'DISCARDED', 'SUPERSEDED']).default('PROPOSED'),
  decision: NullableStringSchema,
  rationale: NullableStringSchema,
  related_refs: StringArraySchema,
  route_refs: StringArraySchema,
  adr_refs: StringArraySchema,
});

export const RepoMapRecordSchema = z.object({
  path: z.string().min(1),
  kind: z.string().min(1),
  service_ref: NullableStringSchema,
  notes: NullableStringSchema,
});

export const FrontendGapRecordSchema = z.object({
  id: z.string().regex(ID_PATTERNS.frontendGap, 'Invalid FGAP id format'),
  title: z.string().min(1),
  status: FrontendGapStatusSchema,
  origin_feature: NullableStringSchema,
  backend_refs: StringArraySchema,
  frontend_scope: NullableStringSchema,
  route_targets: StringArraySchema,
  menu_targets: StringArraySchema,
  suggested_files: StringArraySchema,
  implemented_files: StringArraySchema,
  resolved_by_feature: NullableStringSchema,
  related_route_ids: StringArraySchema,
  notes: NullableStringSchema,
  created_at: NullableStringSchema,
  updated_at: NullableStringSchema,
});

export const FrontendRouteRecordSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  parent_id: NullableStringSchema,
  label: NullableStringSchema,
  nav_surface: NullableStringSchema,
  ui_status: FrontendUiStatusSchema,
  source_gap_ids: StringArraySchema,
  implemented_files: StringArraySchema,
  notes: NullableStringSchema,
});

export const DiscoveryIndexStateSchema = z.object({
  version: z.literal(1),
  counters: z
    .object({
      INS: z.number().int().nonnegative().default(0),
      DEB: z.number().int().nonnegative().default(0),
      RAD: z.number().int().nonnegative().default(0),
      FEAT: z.number().int().nonnegative().default(0),
      FGAP: z.number().int().nonnegative().default(0),
      TD: z.number().int().nonnegative().default(0),
    })
    .default({ INS: 0, DEB: 0, RAD: 0, FEAT: 0, FGAP: 0, TD: 0 }),
  records: z.array(DiscoveryRecordSchema).default([]),
});

export const BacklogStateSchema = z.object({
  version: z.literal(1),
  items: z.array(BacklogItemSchema).default([]),
});

export const TechDebtStateSchema = z.object({
  version: z.literal(1),
  items: z.array(TechDebtRecordSchema).default([]),
});

export const FinalizeQueueStateSchema = z.object({
  version: z.literal(1),
  items: z.array(FinalizeQueueItemSchema).default([]),
});

export const UnblockEventsStateSchema = z.object({
  version: z.literal(1),
  events: z.array(UnblockEventSchema).default([]),
});

export const SkillCatalogStateSchema = z.object({
  version: z.literal(1),
  skills: z.array(SkillCatalogEntrySchema).default([]),
  bundles: z.array(SkillBundleSchema).default([]),
});

export const FrontendGapsStateSchema = z.object({
  version: z.literal(1),
  items: z.array(FrontendGapRecordSchema).default([]),
});

export const FrontendMapStateSchema = z.object({
  version: z.literal(1),
  routes: z.array(FrontendRouteRecordSchema).default([]),
});

export const ArchitectureStateSchema = z.object({
  version: z.literal(1),
  nodes: z.array(ArchitectureNodeSchema).default([]),
});

export const ServiceCatalogStateSchema = z.object({
  version: z.literal(1),
  services: z.array(ServiceRecordSchema).default([]),
});

export const TechStackStateSchema = z.object({
  version: z.literal(1),
  items: z.array(TechStackRecordSchema).default([]),
});

export const IntegrationContractsStateSchema = z.object({
  version: z.literal(1),
  contracts: z.array(z.string()).default([]),
});

export const FrontendDecisionsStateSchema = z.object({
  version: z.literal(1),
  items: z.array(FrontendDecisionRecordSchema).default([]),
});

export const RepoMapStateSchema = z.object({
  version: z.literal(1),
  items: z.array(RepoMapRecordSchema).default([]),
});

export type OriginType = z.infer<typeof OriginTypeSchema>;
export type Scale = z.infer<typeof ScaleSchema>;
export type ExecutionKind = z.infer<typeof ExecutionKindSchema>;
export type PlanningMode = z.infer<typeof PlanningModeSchema>;
export type DiscoveryRecord = z.infer<typeof DiscoveryRecordSchema>;
export type BacklogItem = z.infer<typeof BacklogItemSchema>;
export type TechDebtRecord = z.infer<typeof TechDebtRecordSchema>;
export type FinalizeQueueItem = z.infer<typeof FinalizeQueueItemSchema>;
export type UnblockEvent = z.infer<typeof UnblockEventSchema>;
export type SkillCatalogEntry = z.infer<typeof SkillCatalogEntrySchema>;
export type SkillBundle = z.infer<typeof SkillBundleSchema>;
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
export type FrontendGapsState = z.infer<typeof FrontendGapsStateSchema>;
export type FrontendMapState = z.infer<typeof FrontendMapStateSchema>;
export type ArchitectureState = z.infer<typeof ArchitectureStateSchema>;
export type ServiceCatalogState = z.infer<typeof ServiceCatalogStateSchema>;
export type TechStackState = z.infer<typeof TechStackStateSchema>;
export type IntegrationContractsState = z.infer<typeof IntegrationContractsStateSchema>;
export type FrontendDecisionsState = z.infer<typeof FrontendDecisionsStateSchema>;
export type RepoMapState = z.infer<typeof RepoMapStateSchema>;
