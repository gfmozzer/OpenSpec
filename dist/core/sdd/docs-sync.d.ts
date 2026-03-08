import type { SddPaths, SddRuntimeConfig } from './state.js';
export declare const README_SDD_BLOCK_START = "<!-- SDD:ONBOARDING:START -->";
export declare const README_SDD_BLOCK_END = "<!-- SDD:ONBOARDING:END -->";
export declare const AGENT_SDD_BLOCK_START = "<!-- SDD:GUIA:START -->";
export declare const AGENT_SDD_BLOCK_END = "<!-- SDD:GUIA:END -->";
export declare const ROOT_AGENTS_SDD_BLOCK_START = "<!-- SDD:ROOT-AGENTS:START -->";
export declare const ROOT_AGENTS_SDD_BLOCK_END = "<!-- SDD:ROOT-AGENTS:END -->";
export declare function syncSddGuideDocs(projectRoot: string, paths: SddPaths, config?: SddRuntimeConfig): Promise<{
    updatedInternalReadme: boolean;
    updatedReadme: boolean;
    updatedAgentGuide: boolean;
    updatedRootAgents: boolean;
    readmeHadMarkers: boolean;
    agentHadMarkers: boolean;
    rootAgentsHadMarkers: boolean;
}>;
export declare function validateSddGuideDocs(projectRoot: string, paths: SddPaths, config?: SddRuntimeConfig): Promise<{
    documentationSync: boolean;
    missingBlocks: string[];
}>;
//# sourceMappingURL=docs-sync.d.ts.map