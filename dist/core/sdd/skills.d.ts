import type { SkillCatalogEntry, SkillBundle, SkillCatalogState } from './types.js';
export interface SkillSuggestFilters {
    phase?: string;
    domains?: string[];
    bundles?: string[];
    max?: number;
}
export interface RankedSkill {
    skill: SkillCatalogEntry;
    score: number;
    reasons: string[];
}
export declare function listBundles(catalog: SkillCatalogState): SkillBundle[];
export declare function suggestSkills(catalog: SkillCatalogState, filters?: SkillSuggestFilters): RankedSkill[];
//# sourceMappingURL=skills.d.ts.map