export interface StructuralLens {
    artifact_type: string;
    name: string;
    required_sections: string[];
    forbidden_phrases?: string[];
    section_rules?: Record<string, {
        min_lines?: number;
        min_length?: number;
    }>;
}
export declare const LENSES: Record<string, StructuralLens>;
export declare function extractSectionContent(content: string, sectionHeader: string): string;
export declare function validateDocumentAgainstLens(content: string, lens: StructuralLens): string[];
//# sourceMappingURL=lenses.d.ts.map