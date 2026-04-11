export interface StructuralLens {
    artifact_type: string;
    name: string;
    required_sections: string[];
    forbidden_phrases?: string[];
}
export declare const LENSES: Record<string, StructuralLens>;
export declare function validateDocumentAgainstLens(content: string, lens: StructuralLens): string[];
//# sourceMappingURL=lenses.d.ts.map