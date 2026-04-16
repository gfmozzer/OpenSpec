import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import { SddInitCommand, SddInitContextCommand } from '../core/sdd/init.js';
import { SddCheckCommand } from '../core/sdd/check.js';
import { loadProjectSddConfig, loadSkillCatalogState, resolveSddPaths } from '../core/sdd/state.js';
import { listBundles, suggestSkills } from '../core/sdd/skills.js';
import { SddBreakdownCommand, SddContextCommand, SddDebateCommand, SddDecideCommand, SddFinalizeCommand, SddFrontendImpactCommand, SddFrontendGapCommand, SddIngestDepositoCommand, SddApproveCommand, SddAuditCommand, SddInsightCommand, SddNextCommand, SddOnboardCommand, SddSkillsInvokeCommand, SddSkillsSyncCommand, SddStartCommand, } from '../core/sdd/operations.js';
import { assessSddMigration, SddMigrateCommand } from '../core/sdd/migrate.js';
import { isInteractive } from '../utils/interactive.js';
function parseCsvOption(value) {
    if (!value)
        return [];
    return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}
function parseLangOption(value) {
    if (!value)
        return undefined;
    if (value === 'pt-BR' || value === 'en-US')
        return value;
    throw new Error('Valor invalido em --lang. Use pt-BR ou en-US.');
}
function parseLayoutOption(value) {
    if (!value)
        return undefined;
    if (value === 'legacy' || value === 'pt-BR')
        return value;
    throw new Error('Valor invalido em --layout. Use legacy ou pt-BR.');
}
async function ensureMandatorySddMigration(targetPath) {
    const config = await loadProjectSddConfig(targetPath);
    const paths = resolveSddPaths(targetPath, config);
    try {
        await Promise.all([
            fs.access(paths.configFile),
            fs.access(paths.stateFiles.discoveryIndex),
            fs.access(paths.stateFiles.backlog),
        ]);
    }
    catch {
        return;
    }
    const assessment = await assessSddMigration(targetPath);
    if (!assessment.needsMigration) {
        return;
    }
    const summary = assessment.reasons.join(' | ');
    if (isInteractive()) {
        const { confirm } = await import('@inquirer/prompts');
        const approved = await confirm({
            message: `Migracao SDD obrigatoria detectada. Deseja aplicar agora para continuar? ${summary}`,
            default: true,
        });
        if (!approved) {
            throw new Error('Operacao interrompida: aplique a migracao SDD mandatória com `openspec sdd migrate`.');
        }
    }
    const command = new SddMigrateCommand();
    const result = await command.execute(targetPath, { radToEpic: true });
    for (const message of result.messages) {
        console.log(chalk.yellow(`[sdd:migrate] ${message}`));
    }
}
export function registerSddCommand(program) {
    const sddCmd = program.command('sdd').description('Operacoes de memoria SDD');
    sddCmd
        .command('init [path]')
        .description('Inicializa a estrutura .sdd e os arquivos de estado base')
        .alias('iniciar')
        .option('--frontend', 'Ativa arquivos de estado de frontend e views geradas')
        .option('--lang <lang>', 'Idioma do SDD: pt-BR|en-US')
        .option('--layout <layout>', 'Layout de pastas: legacy|pt-BR')
        .option('--no-render', 'Nao gera views Markdown apos a inicializacao')
        .action(async (targetPath = '.', options) => {
        const command = new SddInitCommand();
        const result = await command.execute(targetPath, {
            frontendEnabled: options?.frontend,
            language: parseLangOption(options?.lang),
            layout: parseLayoutOption(options?.layout),
            render: options?.render,
        });
        console.log(chalk.green('SDD inicializado com sucesso.'));
        console.log(`Diretorio de memoria: ${result.memoryDir}`);
        if (options?.lang) {
            console.log(`Idioma: ${options.lang}`);
        }
        if (options?.layout) {
            console.log(`Layout: ${options.layout}`);
        }
        console.log(`Modulo de frontend: ${result.frontendEnabled ? 'ativado' : 'desativado'}`);
        console.log(`Views geradas: ${result.rendered ? 'sim' : 'nao'}`);
        console.log(`Skills curadas carregadas: ${result.skillsSeeded}`);
        console.log(`Skills locais geradas: ${result.localSkillsMaterialized}`);
        console.log(`Ferramentas sincronizadas: ${result.syncedTools.length > 0 ? result.syncedTools.join(', ') : 'nenhuma detectada'}`);
    });
    sddCmd
        .command('init-context [path]')
        .description('Inspeciona repositorio existente e preenche contexto inicial canônico')
        .alias('iniciar-contexto')
        .option('--mode <mode>', 'Modo de escrita: merge|replace (padrao: merge)')
        .option('--no-deep', 'Desativa inspecao profunda de estrutura de repositorio')
        .option('--no-render', 'Nao gera views apos bootstrap de contexto')
        .option('--json', 'Saida em JSON')
        .action(async (targetPath = '.', options) => {
        if (options?.mode && options.mode !== 'merge' && options.mode !== 'replace') {
            throw new Error('Valor invalido em --mode. Use merge ou replace.');
        }
        const command = new SddInitContextCommand();
        const result = await command.execute(targetPath, {
            mode: options?.mode,
            deep: options?.deep,
            render: options?.render,
        });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(chalk.green('Contexto inicial bootstrapado com sucesso.'));
        console.log(`Diretorio de memoria: ${result.memoryDir}`);
        console.log(`Views geradas: ${result.rendered ? 'sim' : 'nao'}`);
        console.log(`Projeto detectado: ${result.contextBootstrap.detected.package_name}`);
        console.log(`Detectado: stack=${result.contextBootstrap.detected.tech_stack_count}, repo-map=${result.contextBootstrap.detected.repo_map_count}, servicos=${result.contextBootstrap.detected.service_catalog_count}`);
        console.log(`Atualizado: stack=${result.contextBootstrap.updated.tech_stack ? 'sim' : 'nao'}, repo-map=${result.contextBootstrap.updated.repo_map ? 'sim' : 'nao'}, arquitetura=${result.contextBootstrap.updated.architecture ? 'sim' : 'nao'}, servicos=${result.contextBootstrap.updated.service_catalog ? 'sim' : 'nao'}, contratos=${result.contextBootstrap.updated.integration_contracts ? 'sim' : 'nao'}`);
        if (result.contextBootstrap.notes.length > 0) {
            console.log(`Notas: ${result.contextBootstrap.notes.join(' | ')}`);
        }
    });
    sddCmd
        .command('insight <texto>')
        .description('Registra um insight no funil de descoberta do SDD')
        .alias('ideia')
        .option('--title <title>', 'Titulo curto do insight')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (texto, options) => {
        await ensureMandatorySddMigration('.');
        const command = new SddInsightCommand();
        const result = await command.execute('.', texto, {
            title: options?.title,
            render: options?.render,
        });
        console.log(chalk.green(`Insight criado: ${result.id}`));
        console.log(`Titulo: ${result.title}`);
        console.log(`Arquivo: ${result.filePath}`);
    });
    sddCmd
        .command('ingest-deposito')
        .description('Varre o deposito, indexa fontes e gera trilha executavel inicial')
        .alias('ingestao-deposito')
        .alias('ingest')
        .option('--source-dir <path>', 'Diretorio fonte (padrao: .sdd/deposito)')
        .option('--title <title>', 'Titulo do EPIC inicial (quando nao houver --epic/--radar)')
        .option('--epic <epicId>', 'Reaproveita EPIC existente (EPIC-####)')
        .option('--radar <radarId>', 'Reaproveita RAD legado (RAD-###)')
        .option('--titles <list>', 'Titulos de FEAT separados por virgula')
        .option('--scale <scale>', 'Escala QUICK|STANDARD|LARGE')
        .option('--flow-mode <flowMode>', 'Fluxo da FEAT iniciada: direto|padrao|rigoroso')
        .option('--fluxo <flowMode>', 'Alias em portugues para --flow-mode')
        .option('--no-start', 'Nao inicia automaticamente a primeira FEAT pronta')
        .option('--json', 'Saida em JSON')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (options) => {
        await ensureMandatorySddMigration('.');
        const flow = options?.flowMode || options?.fluxo;
        if (flow && !['direto', 'padrao', 'rigoroso'].includes(flow)) {
            throw new Error('Valor invalido em --flow-mode/--fluxo. Use direto, padrao ou rigoroso.');
        }
        const epicRef = options?.epic || options?.radar;
        if (epicRef && !/^(?:RAD|EPIC)-\d{3,}$/.test(epicRef)) {
            throw new Error('Valor invalido em --epic/--radar. Use EPIC-#### ou RAD-###.');
        }
        const command = new SddIngestDepositoCommand();
        const result = await command.execute('.', {
            sourceDir: options?.sourceDir,
            title: options?.title,
            radarId: epicRef,
            titles: parseCsvOption(options?.titles),
            scale: options?.scale,
            flowMode: flow,
            start: options?.start,
            render: options?.render,
        });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(chalk.green('Ingestao de deposito concluida.'));
        console.log(`Diretorio varrido: ${result.source_dir}`);
        console.log(`Arquivos lidos: ${result.scanned_files}`);
        console.log(`Fontes criadas: ${result.indexed_created}`);
        console.log(`Fontes atualizadas: ${result.indexed_updated}`);
        console.log(`EPIC: ${result.radar_id}`);
        console.log(`FEATs criadas: ${result.created_features.join(', ') || '-'}`);
        console.log(`FEATs reaproveitadas: ${result.linked_existing.join(', ') || '-'}`);
        console.log(`FEAT iniciada: ${result.started_feature_id || '-'}`);
        if (result.active_path) {
            console.log(`Workspace ativo: ${result.active_path}`);
        }
        if (result.generated_docs.length > 0) {
            console.log(`Docs gerados: ${result.generated_docs.join(', ')}`);
        }
        if (result.start_warning) {
            console.log(chalk.yellow(`Aviso: ${result.start_warning}`));
        }
        console.log(`Skills recomendadas no fluxo: ${result.used_skills.join(', ')}`);
        console.log(`Prompt recomendado: ${result.recommended_prompt}`);
    });
    sddCmd
        .command('debate <insightId>')
        .description('Abre um debate a partir de um insight')
        .alias('debater')
        .option('--title <title>', 'Titulo do debate')
        .option('--agent <name>', 'Nome do agente que iniciou o debate')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (insightId, options) => {
        await ensureMandatorySddMigration('.');
        const command = new SddDebateCommand();
        const result = await command.execute('.', insightId, {
            title: options?.title,
            agent: options?.agent,
            render: options?.render,
        });
        console.log(chalk.green(`Debate criado: ${result.id}`));
        console.log(`Titulo: ${result.title}`);
        console.log(`Arquivo: ${result.filePath}`);
    });
    sddCmd
        .command('decide <debateId>')
        .description('Decide o resultado de um debate: epic ou descarte')
        .alias('decidir')
        .requiredOption('--outcome <result>', 'Resultado: epic|discard (radar legado ainda aceito)')
        .option('--title <title>', 'Titulo do epic (quando outcome=epic; radar legado ainda aceito)')
        .option('--rationale <text>', 'Racional da decisao')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (debateId, options) => {
        await ensureMandatorySddMigration('.');
        const outcome = options?.outcome;
        if (outcome !== 'radar' && outcome !== 'epic' && outcome !== 'discard') {
            throw new Error('Valor invalido em --outcome. Use epic, discard ou radar (legado).');
        }
        const normalizedOutcome = outcome === 'epic' ? 'radar' : outcome;
        const command = new SddDecideCommand();
        const result = await command.execute('.', debateId, normalizedOutcome, {
            title: options?.title,
            rationale: options?.rationale,
            render: options?.render,
        });
        if (result.outcome === 'radar') {
            console.log(chalk.green(`Debate ${debateId} aprovado para EPIC ${result.radarId}`));
            console.log(`Arquivo: ${result.radarPath}`);
        }
        else {
            console.log(chalk.yellow(`Debate ${debateId} descartado.`));
            console.log(`Arquivo: ${result.discardPath}`);
        }
    });
    sddCmd
        .command('breakdown <radarId>')
        .description('Quebra um EPIC em uma ou mais features FEAT (RAD legado ainda aceito)')
        .alias('quebrar')
        .alias('desdobrar')
        .option('--titles <list>', 'Titulos separados por virgula para gerar varias FEAT')
        .option('--scale <scale>', 'Escala QUICK|STANDARD|LARGE')
        .option('--mode <mode>', 'Modo de quebra: graph|flat (padrao: graph)')
        .option('--incremental', 'Integra novas FEATs ao grafo existente')
        .option('--dedupe <mode>', 'Modo de dedupe: strict|normal|off (padrao: normal)')
        .option('--json', 'Saida em JSON')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (radarId, options) => {
        await ensureMandatorySddMigration('.');
        if (options?.mode && options.mode !== 'graph' && options.mode !== 'flat') {
            throw new Error('Valor invalido em --mode. Use graph ou flat.');
        }
        if (options?.dedupe && !['strict', 'normal', 'off'].includes(options.dedupe)) {
            throw new Error('Valor invalido em --dedupe. Use strict, normal ou off.');
        }
        const command = new SddBreakdownCommand();
        const result = await command.execute('.', radarId, {
            titles: parseCsvOption(options?.titles),
            scale: options?.scale,
            mode: options?.mode,
            incremental: options?.incremental,
            dedupe: options?.dedupe,
            render: options?.render,
        });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(chalk.green(`Breakdown concluido para ${result.radarId}`));
        console.log(`Features criadas: ${result.created.join(', ') || '-'}`);
        console.log(`Links reaproveitados: ${result.linked_existing.join(', ') || '-'}`);
        console.log(`Rewires: ${result.rewired_dependencies.length}`);
        console.log(`Duplicatas puladas: ${result.skipped_duplicates.length}`);
    });
    sddCmd
        .command('start <refOrText>')
        .description('Inicia execucao de FEAT/EPIC/FGAP/TD ou cria FEAT direta (RAD legado ainda aceito)')
        .alias('iniciar-execucao')
        .option('--scale <scale>', 'Escala QUICK|STANDARD|LARGE')
        .option('--schema <schema>', 'Schema para criar change em openspec/changes')
        .option('--force', 'Bypass de bloqueios e conflitos de lock')
        .option('--force-transition', 'Bypass das restrições e violações das lentes estruturais')
        .option('--flow-mode <flowMode>', 'Fluxo: direto|padrao|rigoroso')
        .option('--fluxo <flowMode>', 'Alias em portugues para --flow-mode')
        .option('--json', 'Saida em JSON')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (refOrText, options) => {
        await ensureMandatorySddMigration('.');
        const flow = options?.flowMode || options?.fluxo;
        if (flow && !['direto', 'padrao', 'rigoroso'].includes(flow)) {
            throw new Error('Valor invalido em --flow-mode/--fluxo. Use direto, padrao ou rigoroso.');
        }
        const command = new SddStartCommand();
        const result = await command.execute('.', refOrText, {
            scale: options?.scale,
            schema: options?.schema,
            force: options?.force,
            forceTransition: options?.forceTransition,
            flowMode: flow,
            render: options?.render,
        });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(chalk.green(`Execucao iniciada para ${result.featureId}`));
        console.log(`Change: ${result.changeName}`);
        console.log(`Status: ${result.status}`);
        console.log(`Guardrails: blocked=${result.start_guardrails.blocked_check.ok ? 'ok' : 'fail'} | lock=${result.start_guardrails.lock_check.ok ? 'ok' : 'fail'} | forced=${result.start_guardrails.forced ? 'sim' : 'nao'}`);
        console.log(`Workspace ativo: ${result.active_path}`);
        console.log(`Docs gerados: ${result.generated_docs.join(', ')}`);
        console.log(`Fluxo: ${result.flow_mode}`);
        console.log(`Bundles sugeridos: ${result.recommended_bundles.join(', ') || '-'}`);
    });
    sddCmd
        .command('frontend-impact <featureId>')
        .description('Declara impacto de frontend para uma FEAT')
        .alias('impacto-frontend')
        .option('--status <status>', 'Status: unknown|none|required')
        .option('--reason <texto>', 'Justificativa obrigatoria para status=none')
        .option('--routes <list>', 'Rotas separadas por virgula')
        .option('--surfaces <list>', 'Superficies de UI separadas por virgula')
        .option('--json', 'Saida em JSON')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (featureId, options) => {
        await ensureMandatorySddMigration('.');
        const status = options?.status;
        if (!status || !['unknown', 'none', 'required'].includes(status)) {
            throw new Error('Valor invalido em --status. Use unknown, none ou required.');
        }
        const command = new SddFrontendImpactCommand();
        const result = await command.execute('.', featureId, {
            status,
            reason: options?.reason,
            routes: parseCsvOption(options?.routes),
            surfaces: parseCsvOption(options?.surfaces),
            render: options?.render,
        });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(chalk.green(`Impacto frontend atualizado para ${result.feature_id}`));
        console.log(`Status: ${result.frontend_impact_status}`);
        console.log(`Declarado em: ${result.frontend_impact_declared_at || '-'}`);
        console.log(`Superficies: ${result.frontend_surface_tokens.join(', ') || '-'}`);
    });
    sddCmd
        .command('finalize')
        .description('Consolida memoria e marca FEAT como DONE')
        .alias('consolidar')
        .option('--ref <featId>', 'Finaliza feature especifica (ex: FEAT-0001)')
        .option('--all-ready', 'Finaliza todas as features prontas na fila')
        .option('--no-adr', 'Nao gera ADR automatico nesta execucao')
        .option('--force-frontend', 'Bypass dos guardrails de frontend com auditoria explicita')
        .option('--force-transition', 'Bypass de bloqueios estruturais por lentes no finalize')
        .option('--json', 'Saida em JSON')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (options) => {
        await ensureMandatorySddMigration('.');
        const command = new SddFinalizeCommand();
        const result = await command.execute('.', {
            ref: options?.ref,
            allReady: options?.allReady,
            noAdr: options?.noAdr,
            forceFrontend: options?.forceFrontend,
            forceTransition: options?.forceTransition,
            render: options?.render,
        });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        if (result.finalized.length === 0) {
            console.log('Nenhuma feature finalizada nesta execucao.');
        }
        else {
            console.log(chalk.green(`Finalizadas: ${result.finalized.join(', ')}`));
        }
        console.log(`Liberadas: ${result.unblocked.join(', ') || '-'}`);
        console.log(`Pendentes na fila: ${result.pending}`);
        console.log(`Docs core atualizados: ${result.updated_core_docs?.join(', ') || '-'}`);
        console.log(`README sincronizado: ${result.updated_readme ? 'sim' : 'nao'}`);
        console.log(`Guia do agente sincronizado: ${result.updated_agent_guide ? 'sim' : 'nao'}`);
        if (result.auto_frontend_gaps?.length) {
            console.log(`FGAPs automáticos criados: ${result.auto_frontend_gaps.join(', ')}`);
        }
        if (result.frontend_guardrails?.length) {
            const blocked = result.frontend_guardrails.filter((entry) => entry.blocked).length;
            const forced = result.frontend_guardrails.filter((entry) => entry.forced).length;
            console.log(`Guardrails frontend: avaliados=${result.frontend_guardrails.length} bloqueadas=${blocked} forced=${forced}`);
        }
        if (result.doc_warnings?.length) {
            console.log(`Avisos de docs: ${result.doc_warnings.join(' | ')}`);
        }
    });
    sddCmd
        .command('context <ref>')
        .description('Gera contexto objetivo para FEAT/EPIC/FGAP/TD (RAD legado ainda aceito)')
        .alias('contexto')
        .option('--json', 'Saida em JSON')
        .action(async (ref, options) => {
        await ensureMandatorySddMigration('.');
        const command = new SddContextCommand();
        const context = await command.execute('.', ref);
        if (options?.json) {
            console.log(JSON.stringify(context, null, 2));
            return;
        }
        console.log(`Contexto de ${context.target_id} (${context.target_type})`);
        console.log(`Resumo: ${context.summary}`);
        console.log(`Core docs: ${context.core_docs.join(', ')}`);
        if (context.origin) {
            const origin = context.origin;
            console.log(`Origem: ${origin.type}${origin.ref ? ` (${origin.ref})` : ''}`);
        }
        if (context.related_features) {
            const refs = context.related_features;
            console.log(`Features relacionadas: ${refs.join(', ') || '-'}`);
        }
        if (context.recommended_skills) {
            const skills = context.recommended_skills;
            console.log(`Skills sugeridas: ${skills.join(', ') || '-'}`);
        }
        if (context.read_order) {
            const readOrder = context.read_order;
            console.log(`Ordem de leitura: ${readOrder.join(' -> ')}`);
        }
        if (context.frontend_impact_status) {
            console.log(`Impacto frontend: ${String(context.frontend_impact_status || 'unknown')}`);
        }
    });
    sddCmd
        .command('onboard [target]')
        .description('Gera onboarding estruturado para system, EPIC-#### ou FEAT-####')
        .alias('integrar')
        .alias('orientar')
        .option('--json', 'Saida em JSON')
        .option('--compact', 'Retorna payload resumido')
        .action(async (target = 'system', options) => {
        await ensureMandatorySddMigration('.');
        const command = new SddOnboardCommand();
        const result = await command.execute('.', target, { compact: options?.compact });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        const view = result;
        console.log(`Onboarding: ${String(view.target || target)}`);
        console.log(`Resumo: ${String(view.summary || '-')}`);
        if (Array.isArray(view.read_order)) {
            console.log(`Ordem de leitura: ${view.read_order.join(' -> ')}`);
        }
        if (Array.isArray(view.proximos_passos)) {
            console.log(`Proximos passos: ${view.proximos_passos.join(', ')}`);
        }
    });
    sddCmd
        .command('aprovar <featId>')
        .description('Aprova etapa de proposta, planejamento ou tarefas de uma FEAT')
        .requiredOption('--etapa <etapa>', 'Etapa: proposta|planejamento|tarefas')
        .option('--por <nome>', 'Quem aprovou')
        .option('--observacao <texto>', 'Observacao da aprovacao')
        .option('--json', 'Saida em JSON')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (featId, options) => {
        await ensureMandatorySddMigration('.');
        const etapa = options?.etapa;
        if (!etapa || !['proposta', 'planejamento', 'tarefas'].includes(etapa)) {
            throw new Error('Valor invalido em --etapa. Use proposta, planejamento ou tarefas.');
        }
        const command = new SddApproveCommand();
        const result = await command.execute('.', featId, etapa, {
            by: options?.por,
            note: options?.observacao,
            render: options?.render,
        });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(chalk.green(`Etapa ${result.stage} aprovada para ${result.feature_id}`));
        console.log(`Status do gate: ${result.status}`);
        console.log(`Etapa atual da feature: ${result.current_stage}`);
    });
    sddCmd
        .command('next [path]')
        .description('Mostra FEATs prontas para iniciar em paralelo')
        .alias('proximo')
        .option('--rank <mode>', 'Ranking: impact|criticality|fifo (padrao: impact)')
        .option('--limit <n>', 'Limite de itens prontos (padrao: 10)')
        .option('--json', 'Saida em JSON')
        .action(async (targetPath = '.', options) => {
        await ensureMandatorySddMigration(targetPath);
        if (options?.rank && !['impact', 'criticality', 'fifo'].includes(options.rank)) {
            throw new Error('Valor invalido em --rank. Use impact, criticality ou fifo.');
        }
        const command = new SddNextCommand();
        const result = await command.execute(targetPath, {
            rank: options?.rank,
            limit: options?.limit ? Number(options.limit) : undefined,
        });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(`Ranking: ${result.rank}`);
        console.log(`Prontas: ${result.ready.length}`);
        for (const item of result.ready) {
            const skills = item.recommended_skills.length > 0 ? item.recommended_skills.join(', ') : '-';
            console.log(`- ${item.id}: ${item.title} | score=${item.score} | skills: ${skills}`);
            console.log(`  motivos: ${item.reasons.join('; ')}`);
        }
        console.log(`Bloqueadas: ${result.blocked.length}`);
        for (const item of result.blocked) {
            const deps = item.blocked_by.length > 0 ? item.blocked_by.join(', ') : '-';
            console.log(`- ${item.id}: ${item.title} | blocked_by: ${deps}`);
        }
        console.log(`Conflitos de lock: ${result.conflicts.length}`);
        for (const item of result.conflicts) {
            const locks = item.lock_domains.length > 0 ? item.lock_domains.join(', ') : '-';
            console.log(`- ${item.id}: ${item.title} | locks: ${locks}`);
        }
    });
    sddCmd
        .command('audit [path]')
        .description('Audita a saude de meta-evolucao do SDD (placeholders, deliberacao, ADR e forced transition)')
        .alias('auditar')
        .option('--json', 'Saida em JSON')
        .action(async (targetPath = '.', options) => {
        await ensureMandatorySddMigration(targetPath);
        const command = new SddAuditCommand();
        const result = await command.execute(targetPath);
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(chalk.green('Auditoria SDD concluida.'));
        console.log(`Gerado em: ${result.generated_at}`);
        console.log(`Score: ${result.score}% (limiar: ${result.meta_evolution.health_alert_threshold}%)`);
        console.log(`Saude: ${result.healthy ? 'OK' : 'ALERTA'}`);
        console.log(`Artefatos sem placeholder: ${result.metrics.artifacts_without_placeholder.ok}/${result.metrics.artifacts_without_placeholder.total} (${result.metrics.artifacts_without_placeholder.percent}%)`);
        console.log(`Debates com deliberacao real: ${result.metrics.debates_with_real_deliberation.ok}/${result.metrics.debates_with_real_deliberation.total} (${result.metrics.debates_with_real_deliberation.percent}%)`);
        console.log(`ADRs gerados vs esperados: ${result.metrics.adrs_generated_vs_expected.ok}/${result.metrics.adrs_generated_vs_expected.total} (${result.metrics.adrs_generated_vs_expected.percent}%)`);
        console.log(`Forced transitions detectadas: ${result.metrics.forced_transitions.total}`);
        if (result.metrics.forced_transitions.feature_refs.length > 0) {
            console.log(`Features com evidencias: ${result.metrics.forced_transitions.feature_refs.join(', ')}`);
        }
        console.log(result.recommendation);
    });
    sddCmd
        .command('check [path]')
        .description('Valida arquivos de estado .sdd e opcionalmente gera views')
        .alias('checar')
        .option('--render', 'Gera views Markdown apos validacao bem-sucedida')
        .option('--json', 'Retorna relatorio em JSON')
        .action(async (targetPath = '.', options) => {
        await ensureMandatorySddMigration(targetPath);
        const command = new SddCheckCommand();
        const report = await command.execute(targetPath, {
            render: options?.render,
        });
        if (options?.json) {
            console.log(JSON.stringify(report, null, 2));
        }
        else {
            console.log(`Valido: ${report.valid ? 'sim' : 'nao'}`);
            console.log(`Registros de discovery: ${report.summary.discovery}`);
            console.log(`Itens de backlog: ${report.summary.backlog}`);
            console.log(`Itens de divida tecnica: ${report.summary.techDebt}`);
            console.log(`Itens na fila de finalize: ${report.summary.finalizeQueue}`);
            console.log(`Frontend ativado: ${report.summary.frontendEnabled ? 'sim' : 'nao'}`);
            console.log(`Progresso global: ${report.summary.progress_global.percent}% (${report.summary.progress_global.done}/${report.summary.progress_global.total})`);
            console.log(`Prontas para paralelo: ${report.summary.ready_for_parallel}`);
            console.log(`Bloqueadas: ${report.summary.blocked}`);
            console.log(`Em conflito de lock: ${report.summary.lock_conflicts}`);
            console.log(`Documentacao sincronizada: ${report.summary.documentation_sync ? 'sim' : 'nao'}`);
            console.log(`Views core desatualizadas: ${report.summary.core_views_stale ? 'sim' : 'nao'}`);
            console.log(`Cobertura frontend sincronizada: ${report.summary.frontend_coverage_sync ? 'sim' : 'nao'}`);
            if (report.summary.missing_architecture_fields.length > 0) {
                console.log(`Campos canônicos pendentes: ${report.summary.missing_architecture_fields.join(', ')}`);
            }
            if (report.summary.features_missing_frontend_declaration.length > 0) {
                console.log(`Features sem declaracao frontend: ${report.summary.features_missing_frontend_declaration.join(', ')}`);
            }
            if (report.summary.features_with_frontend_conflict.length > 0) {
                console.log(`Features com conflito frontend: ${report.summary.features_with_frontend_conflict.join(', ')}`);
            }
            if (report.summary.features_missing_fgap_link.length > 0) {
                console.log(`Features required sem FGAP: ${report.summary.features_missing_fgap_link.join(', ')}`);
            }
            if (report.summary.progress_by_radar.length > 0) {
                console.log('Progresso por EPIC:');
                for (const radar of report.summary.progress_by_radar) {
                    console.log(`- ${radar.radar_id}: ${radar.percent}% (${radar.done}/${radar.total})`);
                }
            }
            if (report.summary.frontendEnabled) {
                console.log(`Gaps de frontend: ${report.summary.frontendGaps}`);
                console.log(`Rotas de frontend: ${report.summary.frontendRoutes}`);
            }
            if (report.warnings.length > 0) {
                console.log(chalk.yellow('\nAvisos:'));
                for (const warning of report.warnings) {
                    console.log(`- ${warning}`);
                }
            }
            if (report.errors.length > 0) {
                console.log(chalk.red('\nErros:'));
                for (const error of report.errors) {
                    console.log(`- ${error}`);
                }
            }
        }
        if (!report.valid) {
            throw new Error('Falha na validacao do SDD');
        }
    });
    sddCmd
        .command('migrate')
        .description('Migra entidades legado para os novos formatos SDD')
        .alias('migrar')
        .option('--rad-to-epic', 'Migra instancias de RAD para EPIC (4-digitos)')
        .option('--json', 'Saida em JSON')
        .action(async (options) => {
        const command = new SddMigrateCommand();
        const result = await command.execute('.', { radToEpic: options?.radToEpic });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(chalk.green(`Migracao concluida.`));
        for (const msg of result.messages) {
            console.log(`- ${msg}`);
        }
    });
    const skillsCmd = sddCmd
        .command('skills')
        .description('Operacoes de curadoria e sugestao de skills');
    skillsCmd.alias('habilidades');
    skillsCmd
        .command('bundles [path]')
        .description('Lista os bundles disponiveis no catalogo de skills')
        .alias('pacotes')
        .option('--json', 'Retorna resultado em JSON')
        .action(async (targetPath = '.', options) => {
        await ensureMandatorySddMigration(targetPath);
        const config = await loadProjectSddConfig(targetPath);
        const paths = resolveSddPaths(targetPath, config);
        const catalog = await loadSkillCatalogState(paths);
        const bundles = listBundles(catalog);
        if (options?.json) {
            console.log(JSON.stringify(bundles, null, 2));
            return;
        }
        console.log(`Bundles disponiveis: ${bundles.length}`);
        for (const bundle of bundles) {
            console.log(`- ${bundle.id} (${bundle.skill_ids.length} skills)`);
        }
    });
    skillsCmd
        .command('sync [path]')
        .description('Sincroniza skills curadas do catalogo para ferramentas configuradas')
        .alias('sincronizar')
        .option('--bundle <id>', 'Filtra por bundle especifico (pode repetir via CSV com virgula)')
        .option('--all', 'Sincroniza todas as skills do catalogo')
        .option('--tools <list>', 'Ferramentas alvo separadas por virgula (ex: codex,cursor,claude)')
        .action(async (targetPath = '.', options) => {
        await ensureMandatorySddMigration(targetPath);
        const command = new SddSkillsSyncCommand();
        const bundles = parseCsvOption(options?.bundle);
        const tools = parseCsvOption(options?.tools);
        const result = await command.execute(targetPath, {
            bundles,
            all: options?.all,
            tools,
        });
        const config = await loadProjectSddConfig(targetPath);
        const paths = resolveSddPaths(targetPath, config);
        const localSkillsPath = `${paths.memoryRoot.replace(/\\/g, '/')}/${config.folders.skills}/${paths.skillsCuratedFolderName}`;
        console.log(chalk.green(`Skills sincronizadas: ${result.synced}`));
        console.log(`Skills locais (${localSkillsPath}): ${result.local_synced}`);
        console.log(`Ferramentas atualizadas: ${result.tools.length > 0 ? result.tools.join(', ') : 'nenhuma'}`);
    });
    skillsCmd
        .command('suggest [path]')
        .description('Sugere skills por contexto (fase, dominio e bundle)')
        .alias('sugerir')
        .option('--phase <phase>', 'Fase da tarefa: discover|plan|execute|verify|finalize')
        .option('--domains <list>', 'Dominios separados por virgula (ex: backend,security,api)')
        .option('--bundles <list>', 'Bundles separados por virgula')
        .option('--max <n>', 'Quantidade maxima de sugestoes (padrao: 5)')
        .option('--json', 'Retorna resultado em JSON')
        .action(async (targetPath = '.', options) => {
        await ensureMandatorySddMigration(targetPath);
        const config = await loadProjectSddConfig(targetPath);
        const paths = resolveSddPaths(targetPath, config);
        const catalog = await loadSkillCatalogState(paths);
        const ranked = suggestSkills(catalog, {
            phase: options?.phase,
            domains: parseCsvOption(options?.domains),
            bundles: parseCsvOption(options?.bundles),
            max: options?.max ? Number(options.max) : undefined,
        });
        if (options?.json) {
            console.log(JSON.stringify(ranked.map((entry) => ({
                id: entry.skill.id,
                title: entry.skill.title,
                score: entry.score,
                reasons: entry.reasons,
                bundles: entry.skill.bundle_ids,
                domains: entry.skill.domains,
                phases: entry.skill.phases,
            })), null, 2));
            return;
        }
        if (ranked.length === 0) {
            console.log('Nenhuma skill encontrada para os filtros informados.');
            return;
        }
        console.log(`Sugestoes de skills (${ranked.length}):`);
        for (const entry of ranked) {
            const reasons = entry.reasons.length > 0 ? ` | criterios: ${entry.reasons.join('; ')}` : '';
            console.log(`- ${entry.skill.id} (${entry.score})${reasons}`);
        }
    });
    skillsCmd
        .command('usar [path]')
        .description('Monta um prompt pronto para invocar skills no agente')
        .alias('invocar')
        .option('--ids <list>', 'IDs de skills separados por virgula')
        .option('--phase <phase>', 'Fase para sugestao: discover|plan|execute|verify|finalize')
        .option('--domains <list>', 'Dominios separados por virgula')
        .option('--bundles <list>', 'Bundles separados por virgula')
        .option('--max <n>', 'Quantidade maxima quando usar sugestao (padrao: 5)')
        .option('--objetivo <texto>', 'Objetivo em linguagem natural para o prompt')
        .option('--ref <id>', 'Referencia de contexto (ex: FEAT-0001, EPIC-0001)')
        .option('--json', 'Retorna payload em JSON')
        .action(async (targetPath = '.', options) => {
        await ensureMandatorySddMigration(targetPath);
        const command = new SddSkillsInvokeCommand();
        const result = await command.execute(targetPath, {
            ids: parseCsvOption(options?.ids),
            phase: options?.phase,
            domains: parseCsvOption(options?.domains),
            bundles: parseCsvOption(options?.bundles),
            max: options?.max ? Number(options.max) : undefined,
            objective: options?.objetivo,
            ref: options?.ref,
        });
        if (options?.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(chalk.green(`Skills selecionadas: ${result.selected_skills.length}`));
        for (const skill of result.selected_skills) {
            console.log(`- ${skill.id} (${skill.title})`);
            console.log(`  path: ${skill.path}`);
        }
        console.log('\nPrompt pronto para usar no agente:\n');
        console.log(result.prompt);
    });
    const gapCmd = sddCmd.command('fgap').description('Operacoes de gaps de frontend');
    gapCmd.alias('lacunas-frontend');
    gapCmd
        .command('add <title>')
        .description('Abre um novo FGAP')
        .alias('abrir')
        .option('--origin <featId>', 'Feature de origem (FEAT-0001)')
        .option('--routes <list>', 'Rotas separadas por virgula')
        .option('--menu <list>', 'Alvos de menu separados por virgula')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (title, options) => {
        await ensureMandatorySddMigration('.');
        const command = new SddFrontendGapCommand();
        const result = await command.add('.', title, {
            originFeature: options?.origin,
            routes: parseCsvOption(options?.routes),
            menu: parseCsvOption(options?.menu),
            render: options?.render,
        });
        console.log(chalk.green(`Gap criado: ${result.id}`));
    });
    gapCmd
        .command('done <gapId>')
        .description('Marca um FGAP como resolvido')
        .alias('resolver')
        .option('--feature <featId>', 'Feature que resolveu o gap')
        .option('--files <list>', 'Arquivos implementados separados por virgula')
        .option('--routes <list>', 'Rotas atualizadas separadas por virgula')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (gapId, options) => {
        await ensureMandatorySddMigration('.');
        const command = new SddFrontendGapCommand();
        const result = await command.resolve('.', gapId, {
            feature: options?.feature,
            files: parseCsvOption(options?.files),
            routes: parseCsvOption(options?.routes),
            render: options?.render,
        });
        console.log(chalk.green(`Gap ${result.id} atualizado para ${result.status}`));
    });
}
//# sourceMappingURL=sdd.js.map