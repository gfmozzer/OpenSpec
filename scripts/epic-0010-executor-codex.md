# Workflow de Execução: EPIC-0010 (Frente 20, 21 e 22)

Sua missão como Codex (Arquiteto Máster e Implementador) é pegar as Frentes SDD e traduzi-las em código-fonte final. O Gemini iniciou esse orquestramento e preparou rascunhos densos de 1 a 3 para você consumir.

Você deverá implementar estritamente as tarefas registradas nas seguintes features e nesta exata ordem. Cada fase envolve a edição do core ts, a validação nas suits vitest e o fechamento do checklist.

## Ordem de Processamento

### Fase 1: FEAT-0020 (Transition Log Engine)
- **Local:** `.sdd/active/FEAT-0020/` (Leia os arquivos 2-plan e 3-tasks desta pasta)
- **Alvo Principal:** `src/core/sdd/transition-engine.ts`, `types.ts`, `state.ts`.
- **Regras:** Remova by-passes antigos e torne o motor a unica via. Adicione logs ao yaml local em modo append-only.
- **Fechamento:** Marque com `[x]` as tarefas em `.sdd/active/FEAT-0020/3-tasks.md`.

### Fase 2: FEAT-0021 (Deduplicação de Semântica e Warn)
- **Local:** `.sdd/active/FEAT-0021/`
- **Alvo Principal:** Modulos de dedup de string-matches exatos para similaridade textual (Jaccard + n-grams) implementando logica de 'Warn-And-Link'.
- **Regras:** Cria os algoritmos e chame nas operações de insights/backlogs, definindo logs `warning`.
- **Fechamento:** Marque com `[x]` as tarefas em `.sdd/active/FEAT-0021/3-tasks.md`.

### Fase 3: FEAT-0022 (Idempotência Field-wise de Finalize)
- **Local:** `.sdd/active/FEAT-0022/`
- **Alvo Principal:** Motor e modulos do `finalize` na area do catalogo de servicos e arquivos similares para operar com `set Unios` ao inves de overrides textuais.
- **Regras:** Idempotencia forte (rodar duas vezes produz mesmo catalogo, sem strings "Consolidado por" duplicadas). Upserts.
- **Fechamento:** Marque com `[x]` as tarefas em `.sdd/active/FEAT-0022/3-tasks.md`.

## Diretriz de Auto-Correção
Após finalizar uma pasta ou fase, verifique se os testes vitest que dependem dessas alterações quebram. Resolva eventuais pendências estruturais antes de ir para a próxima feature. Se der erro no interpretador ou se `pnpm` não existir, assuma que estamos num ecosistema com `node` e utilitarios Node ou resolva semanticamente baseando-se no codebase. 

Se por razão de tempo você for interrompido, você deve dar um output no final da sua execução relatando onde parou, quais Fases concluiu e o que falta pro orquestrador (Gemini) prosseguir. Iniciando a execução agora.
