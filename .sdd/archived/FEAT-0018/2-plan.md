# Plano FEAT-0018

## Impacto Arquitetural
- Serviços/touches: docs
- Lock domains: -

## Impacto Frontend
- Frontend gaps relacionados: -
- Rotas/áreas impactadas: (preencher)
- Declaracao obrigatoria: opensdd sdd frontend-impact FEAT-0018 --status required|none --reason "<justificativa>"

## Contratos Afetados
- Consome: implementacao-concluida
- Produz: documentacao-atualizada

## Skills e Bundles Sugeridos
- Skills: architecture, api-design-principles, doc-coauthoring
- Bundles: architecture-backend, essentials-core

## Estrategia de execucao

### Etapa 1 - Mapear o OpenSDD atual
- localizar onde o install/init escolhe defaults;
- localizar onde o runtime SDD cria estrutura e arquivos seed;
- localizar onde skills e bundles sao definidos/materializados;
- localizar onde a ideia de profile existe hoje e o que ela realmente significa.

### Etapa 2 - Mapear os contratos canonicos da Foundation
- levantar skills `foundation-*`, bundles e contrato arquitetural;
- identificar o que e reutilizavel como distribuicao no OpenSDD;
- separar o que deve permanecer exclusivo do repositorio canonico.

### Etapa 3 - Formalizar a decisao arquitetural
- comparar tres modelos de adocao:
  - seed documental/skills;
  - kit estrutural/profile backend;
  - starter backend real derivado.
- escolher um modelo alvo de baixo risco e registrar justificativa.

### Etapa 4 - Organizar a implementacao futura
- definir profile recomendado (`foundation-backend`);
- listar arquivos do OpenSDD que precisarao mudar depois;
- deixar o bootstrap atual preservado como fallback durante transicao.

## Resultado esperado desta feature
- nenhuma mudanca comportamental de bootstrap nesta rodada;
- SDD atualizado com mapa, fronteira canonica, plano de integracao e backlog de implementacao;
- caminho de implementacao limpo e sustentavel preparado para a proxima fase.

## Riscos controlados neste plano
- evitar copiar artefatos canonicos da Foundation para o OpenSDD antes de definir sincronizacao;
- evitar confundir profile de workflow com profile de backend;
- evitar quebrar `opensdd install`/`opensdd sdd init` atuais enquanto a nova camada de distribuicao ainda nao existe.
