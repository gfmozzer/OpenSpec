# Política de Segurança

## Escopo

Esta política cobre o código-fonte, os artefatos publicados no npm e os workflows oficiais do repositório.

## Como reportar uma vulnerabilidade

Não abra issues públicas para vulnerabilidades ainda não corrigidas.

Envie um relato privado para a equipe mantenedora com:

- descrição do problema;
- impacto estimado;
- passos de reprodução;
- versão afetada;
- sugestão de correção, se houver.

Se o repositório estiver hospedado no GitHub público, habilite também o fluxo de private vulnerability reporting nas configurações do repositório.

## O que esperamos no reporte

- prova de conceito mínima;
- informações suficientes para reproduzir sem expor terceiros;
- indicação se há exploração ativa conhecida;
- qualquer prazo de divulgação coordenada desejado.

## O que fazemos ao receber um reporte

- confirmamos recebimento;
- triamos severidade e alcance;
- trabalhamos em correção e mitigação;
- coordenamos divulgação responsável após o patch.

## Práticas de segurança adotadas neste repositório

- licença e publicação declaradas explicitamente;
- dependências gerenciadas por `pnpm` com lockfile versionado;
- CI com build, testes, lint e smoke de instalação;
- `files` restritivo no `package.json` para reduzir superfície publicada;
- arquivos locais, segredos e artefatos temporários excluídos do versionamento;
- automação de atualização de dependências via Dependabot.

## Telemetria

O projeto inclui telemetria anônima de uso de CLI, com desenho privacy-first:

- sem captura de argumentos, conteúdo ou caminhos de arquivos;
- desabilitada em CI;
- opt-out por `OPENSPEC_TELEMETRY=0` ou `DO_NOT_TRACK=1`.

Se você identificar qualquer desvio desse comportamento, reporte como incidente de segurança.

## Boas práticas para contribuidores

- use dados sintéticos em testes;
- revise artefatos antes de commitar;
- evite capturas, logs ou exemplos com informações reais;
- valide mudanças em release, setup e automação com atenção extra.
