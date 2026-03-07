import chalk from 'chalk';
import { SddInitCommand, SddInitContextCommand } from '../core/sdd/init.js';
import { SddCheckCommand } from '../core/sdd/check.js';
import { loadProjectSddConfig, loadSkillCatalogState, resolveSddPaths } from '../core/sdd/state.js';
import { listBundles, suggestSkills } from '../core/sdd/skills.js';
import { SddBreakdownCommand, SddContextCommand, SddDebateCommand, SddDecideCommand, SddFinalizeCommand, SddFrontendGapCommand, SddInsightCommand, SddNextCommand, SddOnboardCommand, SddSkillsSyncCommand, SddStartCommand, } from '../core/sdd/operations.js';
function parseCsvOption(value) {
    if (!value)
        return [];
    return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}
export function registerSddCommand(program) {
    const sddCmd = program.command('sdd').description('Operacoes de memoria SDD');
    sddCmd
        .command('init [path]')
        .description('Inicializa a estrutura .sdd e os arquivos de estado base')
        .option('--frontend', 'Ativa arquivos de estado de frontend e views geradas')
        .option('--no-render', 'Nao gera views Markdown apos a inicializacao')
        .action(async (targetPath = '.', options) => {
        const command = new SddInitCommand();
        const result = await command.execute(targetPath, {
            frontendEnabled: options?.frontend,
            render: options?.render,
        });
        console.log(chalk.green('SDD inicializado com sucesso.'));
        console.log(`Diretorio de memoria: ${result.memoryDir}`);
        console.log(`Modulo de frontend: ${result.frontendEnabled ? 'ativado' : 'desativado'}`);
        console.log(`Views geradas: ${result.rendered ? 'sim' : 'nao'}`);
        console.log(`Skills curadas carregadas: ${result.skillsSeeded}`);
        console.log(`Skills locais geradas: ${result.localSkillsMaterialized}`);
        console.log(`Ferramentas sincronizadas: ${result.syncedTools.length > 0 ? result.syncedTools.join(', ') : 'nenhuma detectada'}`);
    });
    sddCmd
        .command('init-context [path]')
        .description('Inspeciona repositorio existente e preenche contexto inicial canônico')
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
        .description('Registra um insight em .sdd/discovery/1-insights')
        .option('--title <title>', 'Titulo curto do insight')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (texto, options) => {
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
        .command('debate <insightId>')
        .description('Abre um debate a partir de um insight')
        .option('--title <title>', 'Titulo do debate')
        .option('--agent <name>', 'Nome do agente que iniciou o debate')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (insightId, options) => {
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
        .description('Decide o resultado de um debate: radar ou descarte')
        .requiredOption('--outcome <result>', 'Resultado: radar|discard')
        .option('--title <title>', 'Titulo do radar (quando outcome=radar)')
        .option('--rationale <text>', 'Racional da decisao')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (debateId, options) => {
        const outcome = options?.outcome;
        if (outcome !== 'radar' && outcome !== 'discard') {
            throw new Error('Valor invalido em --outcome. Use radar ou discard.');
        }
        const command = new SddDecideCommand();
        const result = await command.execute('.', debateId, outcome, {
            title: options?.title,
            rationale: options?.rationale,
            render: options?.render,
        });
        if (result.outcome === 'radar') {
            console.log(chalk.green(`Debate ${debateId} aprovado para radar ${result.radarId}`));
            console.log(`Arquivo: ${result.radarPath}`);
        }
        else {
            console.log(chalk.yellow(`Debate ${debateId} descartado.`));
            console.log(`Arquivo: ${result.discardPath}`);
        }
    });
    sddCmd
        .command('breakdown <radarId>')
        .description('Quebra um item RAD em uma ou mais features FEAT')
        .option('--titles <list>', 'Titulos separados por virgula para gerar varias FEAT')
        .option('--scale <scale>', 'Escala QUICK|STANDARD|LARGE')
        .option('--mode <mode>', 'Modo de quebra: graph|flat (padrao: graph)')
        .option('--incremental', 'Integra novas FEATs ao grafo existente')
        .option('--dedupe <mode>', 'Modo de dedupe: strict|normal|off (padrao: normal)')
        .option('--json', 'Saida em JSON')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (radarId, options) => {
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
        .description('Inicia execucao de FEAT/RAD/FGAP/TD ou cria FEAT direta')
        .option('--scale <scale>', 'Escala QUICK|STANDARD|LARGE')
        .option('--schema <schema>', 'Schema para criar change em openspec/changes')
        .option('--force', 'Bypass de bloqueios e conflitos de lock')
        .option('--json', 'Saida em JSON')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (refOrText, options) => {
        const command = new SddStartCommand();
        const result = await command.execute('.', refOrText, {
            scale: options?.scale,
            schema: options?.schema,
            force: options?.force,
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
        console.log(`Bundles sugeridos: ${result.recommended_bundles.join(', ') || '-'}`);
    });
    sddCmd
        .command('finalize')
        .description('Consolida memoria e marca FEAT como DONE')
        .option('--ref <featId>', 'Finaliza feature especifica (ex: FEAT-001)')
        .option('--all-ready', 'Finaliza todas as features prontas na fila')
        .option('--no-adr', 'Nao gera ADR automatico nesta execucao')
        .option('--json', 'Saida em JSON')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (options) => {
        const command = new SddFinalizeCommand();
        const result = await command.execute('.', {
            ref: options?.ref,
            allReady: options?.allReady,
            noAdr: options?.noAdr,
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
        if (result.doc_warnings?.length) {
            console.log(`Avisos de docs: ${result.doc_warnings.join(' | ')}`);
        }
    });
    sddCmd
        .command('context <ref>')
        .description('Gera contexto objetivo para FEAT/RAD/FGAP/TD')
        .option('--json', 'Saida em JSON')
        .action(async (ref, options) => {
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
    });
    sddCmd
        .command('onboard [target]')
        .description('Gera onboarding estruturado para system, RAD-### ou FEAT-###')
        .option('--json', 'Saida em JSON')
        .option('--compact', 'Retorna payload resumido')
        .action(async (target = 'system', options) => {
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
        .command('next [path]')
        .description('Mostra FEATs prontas para iniciar em paralelo')
        .option('--rank <mode>', 'Ranking: impact|criticality|fifo (padrao: impact)')
        .option('--limit <n>', 'Limite de itens prontos (padrao: 10)')
        .option('--json', 'Saida em JSON')
        .action(async (targetPath = '.', options) => {
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
        .command('check [path]')
        .description('Valida arquivos de estado .sdd e opcionalmente gera views')
        .option('--render', 'Gera views Markdown apos validacao bem-sucedida')
        .option('--json', 'Retorna relatorio em JSON')
        .action(async (targetPath = '.', options) => {
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
            if (report.summary.missing_architecture_fields.length > 0) {
                console.log(`Campos canônicos pendentes: ${report.summary.missing_architecture_fields.join(', ')}`);
            }
            if (report.summary.progress_by_radar.length > 0) {
                console.log('Progresso por RAD:');
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
    const skillsCmd = sddCmd
        .command('skills')
        .description('Operacoes de curadoria e sugestao de skills');
    skillsCmd
        .command('bundles [path]')
        .description('Lista os bundles disponiveis no catalogo de skills')
        .option('--json', 'Retorna resultado em JSON')
        .action(async (targetPath = '.', options) => {
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
        .option('--bundle <id>', 'Filtra por bundle especifico (pode repetir via CSV com virgula)')
        .option('--all', 'Sincroniza todas as skills do catalogo')
        .option('--tools <list>', 'Ferramentas alvo separadas por virgula (ex: codex,cursor,claude)')
        .action(async (targetPath = '.', options) => {
        const command = new SddSkillsSyncCommand();
        const bundles = parseCsvOption(options?.bundle);
        const tools = parseCsvOption(options?.tools);
        const result = await command.execute(targetPath, {
            bundles,
            all: options?.all,
            tools,
        });
        console.log(chalk.green(`Skills sincronizadas: ${result.synced}`));
        console.log(`Skills locais (.sdd/skills/curated): ${result.local_synced}`);
        console.log(`Ferramentas atualizadas: ${result.tools.length > 0 ? result.tools.join(', ') : 'nenhuma'}`);
    });
    skillsCmd
        .command('suggest [path]')
        .description('Sugere skills por contexto (fase, dominio e bundle)')
        .option('--phase <phase>', 'Fase da tarefa: discover|plan|execute|verify|finalize')
        .option('--domains <list>', 'Dominios separados por virgula (ex: backend,security,api)')
        .option('--bundles <list>', 'Bundles separados por virgula')
        .option('--max <n>', 'Quantidade maxima de sugestoes (padrao: 5)')
        .option('--json', 'Retorna resultado em JSON')
        .action(async (targetPath = '.', options) => {
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
    const gapCmd = sddCmd.command('fgap').description('Operacoes de gaps de frontend');
    gapCmd
        .command('add <title>')
        .description('Abre um novo FGAP')
        .option('--origin <featId>', 'Feature de origem (FEAT-###)')
        .option('--routes <list>', 'Rotas separadas por virgula')
        .option('--menu <list>', 'Alvos de menu separados por virgula')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (title, options) => {
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
        .option('--feature <featId>', 'Feature que resolveu o gap')
        .option('--files <list>', 'Arquivos implementados separados por virgula')
        .option('--routes <list>', 'Rotas atualizadas separadas por virgula')
        .option('--no-render', 'Nao gera views apos atualizar estado')
        .action(async (gapId, options) => {
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