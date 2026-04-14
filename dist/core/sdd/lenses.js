export const LENSES = {
    insight: {
        artifact_type: 'INS',
        name: 'Insight Lens',
        required_sections: ['## Titulo', '## Descricao'],
        section_rules: {
            '## Descricao': { min_length: 100 },
        },
    },
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
        forbidden_phrases: ['(preencher', 'Descrever o resultado', 'Descreva o que'],
    },
    epic: {
        artifact_type: 'EPIC',
        name: 'Epic Lens',
        required_sections: ['## Origem', '## Resumo aprovado', '## Status'],
        forbidden_phrases: ['(preencher resumo aprovado)'],
    },
    feature_spec: {
        artifact_type: 'FEAT_SPEC',
        name: 'Feature Spec Lens',
        required_sections: ['## Resumo da Entrega', '## Objetivo', '## Referencias'],
        section_rules: {
            '## Objetivo': { min_lines: 3 },
        },
    },
    feature_plan: {
        artifact_type: 'FEAT_PLAN',
        name: 'Feature Plan Lens',
        required_sections: ['## Impacto Arquitetural', '## Impacto Frontend', '## Contratos Afetados'],
    },
    taskChecklist: {
        artifact_type: 'FEAT_TASKS',
        name: 'Feature Task Checklist Lens',
        required_sections: ['frontend-impact', 'README.md', 'finalize --ref FEAT-'],
    },
    adr: {
        artifact_type: 'ADR',
        name: 'ADR Lens',
        required_sections: ['## Contexto', '## Decisão', '## Consequências'],
        forbidden_phrases: ['(preencher contexto)'],
    },
};
export function extractSectionContent(content, sectionHeader) {
    // Encontra a seção especificada e pega tudo até o próximo header de mesmo ou maior nível,
    const lines = content.split('\n');
    const startIndex = lines.findIndex(l => l.trim() === sectionHeader);
    if (startIndex === -1) {
        // Tenta encontrar cabecalho parcial caso o template tenha adicionado sufixo
        const partialIndex = lines.findIndex(l => l.trim().startsWith(sectionHeader));
        if (partialIndex === -1)
            return '';
        return extractFromLines(lines, partialIndex);
    }
    return extractFromLines(lines, startIndex);
}
function extractFromLines(lines, startIndex) {
    const contentLines = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith('#'))
            break;
        contentLines.push(lines[i]);
    }
    return contentLines.join('\n').trim();
}
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
    if (lens.section_rules) {
        for (const [sectionHeader, rules] of Object.entries(lens.section_rules)) {
            if (missing.includes(sectionHeader))
                continue;
            const sectionContent = extractSectionContent(content, sectionHeader);
            if (rules.min_length !== undefined && sectionContent.length < rules.min_length) {
                violations.push(`Seção "${sectionHeader}" requer no mínimo ${rules.min_length} caracteres, encontrado: ${sectionContent.length}`);
            }
            if (rules.min_lines !== undefined) {
                // Ignora linhas de listas vazias e placeholders para a checagem real
                const validLines = sectionContent.split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 0 && l !== '-' && !l.startsWith('- [ ]') && !l.includes('preencher') && !l.includes('TODO'));
                if (validLines.length < rules.min_lines) {
                    violations.push(`Seção "${sectionHeader}" requer no mínimo ${rules.min_lines} linhas de conteúdo não vazio, encontrado:\n${sectionContent}`);
                }
            }
        }
    }
    if (violations.length > 0) {
        console.log('LENS VIOLATIONS:', violations);
    }
    return violations;
}
//# sourceMappingURL=lenses.js.map