export interface SddReadmeFolders {
    discovery?: string;
    planning?: string;
    skills?: string;
    templates?: string;
    active?: string;
    deposito?: string;
}
export declare function buildSddInternalReadme(memoryDir?: string, folders?: SddReadmeFolders): string;
export declare const TEMPLATE_1_SPEC_MD = "# Especificacao: [NOME_DA_FEATURE]\n\n## Objetivo\nDescreva o que esta feature precisa entregar para o usuario ou para o sistema.\n\n## Historias do Usuario\n- Como um [ator], quero [acao] para que [motivo].\n\n## Regras de Negocio\n- [ ] Regra 1\n- [ ] Regra 2\n\n## Cenarios de Aceite\n- Ao fazer [x], espero que [y].\n\n## Referencias\n- FEAT:\n- RAD:\n- FGAP:\n- ADR:\n";
export declare const TEMPLATE_2_PLAN_MD = "# Plano de Execucao: [NOME_DA_FEATURE]\n\n## Abordagem Tecnica\nDescreva como a solucao sera implementada.\n\n## Impacto Arquitetural\n- Servicos afetados:\n- Contratos afetados:\n- Dados afetados:\n\n## Impacto no Frontend\n- Rotas afetadas:\n- Gaps criados ou resolvidos:\n- Decisoes de frontend relevantes:\n\n## Skills e Bundles\n- Skills consultadas:\n- Bundles sugeridos:\n\n## Regra de Interseccao\n- Dividas tecnicas relacionadas:\n- Frontend gaps relacionados:\n- Documentacao que precisa mudar:\n";
export declare const TEMPLATE_3_TASKS_MD = "# Checklist de Tarefas: [NOME_DA_FEATURE]\n\n## Passos de Implementacao\n- [ ] Entender o contexto com `opensdd sdd context FEAT-###`\n- [ ] Ajustar ou confirmar o plano tecnico\n- [ ] Implementar o codigo\n- [ ] Validar comportamento e testes\n\n## Consolidacao Obrigatoria\n- [ ] Atualizar `README.md`, `.sdd/AGENT.md`, `AGENTS.md`, `AGENT.md` e os arquivos de `.sdd/core/` afetados\n- [ ] Registrar gaps de frontend criados ou resolvidos\n- [ ] Atualizar o changelog da feature\n- [ ] Arquivar a mudanca tecnica e executar `opensdd sdd finalize --ref FEAT-###`\n";
export declare const TEMPLATE_4_CHANGELOG_MD = "# Changelog de Arquitetura: [NOME_DA_FEATURE]\n\n## Novas Entidades / Modelos\n-\n\n## Novas Rotas / Endpoints / Eventos\n-\n\n## Mudancas Estruturais\n-\n\n## Documentos que Precisam Ser Atualizados\n-\n";
//# sourceMappingURL=default-bootstrap-files.d.ts.map