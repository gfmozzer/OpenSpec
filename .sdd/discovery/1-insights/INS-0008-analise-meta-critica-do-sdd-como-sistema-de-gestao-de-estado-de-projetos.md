# Insight INS-0008

## Titulo
Análise meta-crítica do SDD como sistema de gestão de estado de projetos

## Descricao
Após observar o histórico completo de evolução do OpenSDD (março–abril 2026), incluindo 7 EPICs entregues, 10/11 FEATs concluídas e múltiplos ciclos de refinamento estrutural, emerge a necessidade de uma análise de segunda ordem: o SDD, como está hoje, é realmente a melhor arquitetura de fluxo possível para gerir o estado de projetos de software vivos?

A evidência concreta que motivou este insight:

1. **Títulos poluídos propagando para EPICs e debates** — EPIC-0006, EPIC-0007, DEB-0006 e DEB-0007 herdaram o prefixo "Debate:" nos títulos, indicando ausência de sanitização semântica na transição INS → DEB → EPIC.

2. **Templates de FEAT semanticamente vazios** — em arquivos archivados (FEAT-0004, FEAT-0009), os campos `Objetivo` e `Gates` permanecem como rascunho/placeholder. A lente existe mas não impede a persistência de artefatos ocos.

3. **Velocidade excessiva no funil de decisão** — INS → DEB → EPIC → FEAT pode ser executado em segundos por um agente sem qualquer gate humano real. O debate fica formal mas sem deliberação.

4. **Skills recomendadas são sempre as mesmas** — `architecture`, `concise-planning`, `context-window-management` aparecem em todos os planos de FEAT independente do domínio, sugerindo ausência de roteamento semântico de skills.

5. **Lentes estruturais não bloqueiam na prática** — o `check` valida mas as transições não dependem rigorosamente de lentes aprovadas. A FEAT pode ser arquivada com gates em rascunho.

6. **ADRs são opcionais e pouco integrados** — não existe fluxo mandatório de ADR para decisões arquiteturais relevantes, nem integração do ADR no contexto da FEAT como artefato obrigatório em cenários de impacto alto.

7. **Ausência de avaliação de ROI por debate** — o sistema não distingue insights que precisam de debate longo de insights que deveriam ir direto para EPIC via fast-track validado.

8. **Sem mecanismo de meta-evolução** — o SDD não tem protocolo interno para auditar sua própria eficácia periodicamente e propor melhorias ao funil de forma estruturada.

## Contexto adicional
Este insight foi gerado por análise humana assistida de todo o histórico do projeto, dos arquivos de state, dos templates e dos artefatos archivados. O objetivo é materializar um debate profundo que avalie se o modelo atual é o melhor possível ou se há lacunas estruturais que precisam ser corrigidas antes que o sistema seja adotado em mais projetos.

## Metadados
- Criado em: 2026-04-13
- Origem: análise humana assistida (meta-crítica)
- Prioridade: alta
