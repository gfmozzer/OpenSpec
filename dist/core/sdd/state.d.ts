import { type ArchitectureState, type BacklogState, type DiscoveryIndexState, type FinalizeQueueState, type FrontendDecisionsState, type FrontendGapsState, type FrontendMapState, type IntegrationContractsState, type RepoMapState, type SourceIndexState, type SkillCatalogState, type ServiceCatalogState, type TechStackState, type TechDebtState, type UnblockEventsState } from './types.js';
export interface SddRuntimeConfig {
    enabled: boolean;
    memoryDir: string;
    frontend: {
        enabled: boolean;
    };
    views: {
        autoRender: boolean;
    };
}
export interface SddPaths {
    projectRoot: string;
    memoryRoot: string;
    configFile: string;
    coreDir: string;
    discoveryDir: string;
    pendenciasDir: string;
    stateDir: string;
    skillsDir: string;
    templatesDir: string;
    depositoDir: string;
    stateFiles: {
        discoveryIndex: string;
        backlog: string;
        techDebt: string;
        finalizeQueue: string;
        skillCatalog: string;
        unblockEvents: string;
        frontendGaps: string;
        frontendMap: string;
        architecture: string;
        serviceCatalog: string;
        techStack: string;
        integrationContracts: string;
        frontendDecisions: string;
        repoMap: string;
        sourceIndex: string;
    };
}
export interface SddStateSnapshot {
    discoveryIndex: DiscoveryIndexState;
    backlog: BacklogState;
    techDebt: TechDebtState;
    finalizeQueue: FinalizeQueueState;
    skillCatalog: SkillCatalogState;
    unblockEvents: UnblockEventsState;
    frontendGaps?: FrontendGapsState;
    frontendMap?: FrontendMapState;
    architecture: ArchitectureState;
    serviceCatalog: ServiceCatalogState;
    techStack: TechStackState;
    integrationContracts: IntegrationContractsState;
    frontendDecisions?: FrontendDecisionsState;
    repoMap: RepoMapState;
    sourceIndex: SourceIndexState;
}
export declare function loadProjectSddConfig(projectRoot: string): Promise<SddRuntimeConfig>;
export declare function upsertProjectSddConfig(projectRoot: string, overrides?: {
    frontendEnabled?: boolean;
}): Promise<SddRuntimeConfig>;
export declare function resolveSddPaths(projectRoot: string, config: SddRuntimeConfig): SddPaths;
export declare function ensureBaseStructure(paths: SddPaths): Promise<void>;
export declare function ensureBaseFiles(paths: SddPaths, config: SddRuntimeConfig): Promise<void>;
export declare function loadStateSnapshot(paths: SddPaths, config: SddRuntimeConfig): Promise<SddStateSnapshot>;
export declare function loadSkillCatalogState(paths: SddPaths): Promise<SkillCatalogState>;
export type SddCounterType = 'INS' | 'DEB' | 'RAD' | 'FEAT' | 'FGAP' | 'TD';
export declare function nowIso(): string;
export declare function saveDiscoveryIndexState(paths: SddPaths, state: DiscoveryIndexState): Promise<void>;
export declare function saveBacklogState(paths: SddPaths, state: BacklogState): Promise<void>;
export declare function saveTechDebtState(paths: SddPaths, state: TechDebtState): Promise<void>;
export declare function saveFinalizeQueueState(paths: SddPaths, state: FinalizeQueueState): Promise<void>;
export declare function saveSkillCatalogState(paths: SddPaths, state: SkillCatalogState): Promise<void>;
export declare function saveUnblockEventsState(paths: SddPaths, state: UnblockEventsState): Promise<void>;
export declare function saveFrontendGapsState(paths: SddPaths, state: FrontendGapsState): Promise<void>;
export declare function saveFrontendMapState(paths: SddPaths, state: FrontendMapState): Promise<void>;
export declare function saveArchitectureState(paths: SddPaths, state: ArchitectureState): Promise<void>;
export declare function saveServiceCatalogState(paths: SddPaths, state: ServiceCatalogState): Promise<void>;
export declare function saveTechStackState(paths: SddPaths, state: TechStackState): Promise<void>;
export declare function saveIntegrationContractsState(paths: SddPaths, state: IntegrationContractsState): Promise<void>;
export declare function saveFrontendDecisionsState(paths: SddPaths, state: FrontendDecisionsState): Promise<void>;
export declare function saveRepoMapState(paths: SddPaths, state: RepoMapState): Promise<void>;
export declare function saveSourceIndexState(paths: SddPaths, state: SourceIndexState): Promise<void>;
export declare function allocateEntityId(paths: SddPaths, type: SddCounterType): Promise<string>;
//# sourceMappingURL=state.d.ts.map