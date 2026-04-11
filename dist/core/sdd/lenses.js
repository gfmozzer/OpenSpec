export const LENSES = {
    debate: {
        artifact_type: 'DEB',
        name: 'Debate Lens',
        required_sections: [
            '## 1) Pergunta de decisao (obrigatorio)',
            '## 2) Criterios de decisao (obrigatorio)',
            '## 3) Opcoes consideradas (minimo 2)',
            '### Opcao A',
            '### Opcao B',
            '## 6) Matriz de pontuacao (0-5)',
            '## 7) Decisao do mediador (obrigatorio)',
            '- Escolha (A/B/C):',
            '- Justificativa:',
            '## 8) Saida',
        ],
    },
    taskChecklist: {
        artifact_type: 'FEAT_TASKS',
        name: 'Feature Task Checklist Lens',
        required_sections: ['frontend-impact', 'README.md', 'finalize --ref FEAT-'],
    },
};
export function validateDocumentAgainstLens(content, lens) {
    const missing = lens.required_sections.filter((section) => !content.includes(section));
    const violations = [...missing];
    if (lens.forbidden_phrases) {
        for (const phrase of lens.forbidden_phrases) {
            if (content.includes(phrase)) {
                violations.push(`Frase proibida encontrada: "${phrase}"`);
            }
        }
    }
    return violations;
}
//# sourceMappingURL=lenses.js.map