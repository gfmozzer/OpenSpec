# Tasks FEAT-0019

## Checklist
Aqui documentamos os passos de execucao, organizados em forma de checklist rastreavel.

### 1) Otimização do Runtime Engine Zod (types.ts)
- [x] 1.1 Em `src/core/sdd/types.ts`, alterar as validações estáticas dos Zod Schemas relativos aos atributos de referências.
- [x] 1.2 Documentar comportamento determinístico dos IDs mapeados via tipos primitivos (`ID_PATTERNS`).

### 2) Extensão Global de Checker O(N/1)
- [x] 2.1 Em `src/core/sdd/check.ts`, inicializar classe utilitária (ou função expandida) `ReferenceValidator` recebendo o root `snapshot`.
- [x] 2.2 Coletar ids de todas as entidades globais existentes (Discovery, Backlog) num Set temporário para consultas O(1) de existência.
- [x] 2.3 Implementar `checkDiscoveryOrphans` — valida se os listados em `item.origin_ref` do backlog e nas tasks do finalize estão presentes no HashSet principal. Se não houver, emitir violação do tipo `origin_orphan`.

### 3) Severidade e Flags Legacy CLI
- [x] 3.1 Garantir em `check.ts` / validações que uma flag ou config padrão decida o warning level. Se as referencias cruzadas de FEAT a RAD não encontrarem destinos (em repos bem antigos) soltar `--warning` console log default. 
- [x] 3.2 Impor a quebra de exceção/processo somente na presença paramétrica limpa da flag `--strict` nas configurações do Sdd (`projectConfig.sdd...`). 

### 4) Conclusão 
- [x] 4.1 Modificar arquivos de testes localizados em `test/` confirmando os unit checks.
- [x] 4.2 Executar `pnpm run test` localmente para atestar regressões.
- [x] 4.3 Declarar `opensdd sdd frontend-impact FEAT-0019 --status none` para registrar ausência de impacto visual.
- [x] 4.4 Atualizar `README.md` e documentação operacional com o uso de `sdd check --strict`.
- [x] 4.5 Rodar `opensdd sdd finalize --ref FEAT-0019` para consolidar memória após validação final.
