import { Command } from 'commander';
import chalk from 'chalk';
import { SddInitCommand } from '../core/sdd/init.js';
import { SddCheckCommand } from '../core/sdd/check.js';
import { loadProjectSddConfig, loadSkillCatalogState, resolveSddPaths } from '../core/sdd/state.js';
import { listBundles, suggestSkills } from '../core/sdd/skills.js';

interface SddInitCliOptions {
  frontend?: boolean;
  render?: boolean;
}

interface SddCheckCliOptions {
  render?: boolean;
  json?: boolean;
}

interface SddSkillsSuggestCliOptions {
  phase?: string;
  domains?: string;
  bundles?: string;
  max?: string;
  json?: boolean;
}

function parseCsvOption(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function registerSddCommand(program: Command): void {
  const sddCmd = program.command('sdd').description('Operacoes de memoria SDD');

  sddCmd
    .command('init [path]')
    .description('Inicializa a estrutura .sdd e os arquivos de estado base')
    .option('--frontend', 'Ativa arquivos de estado de frontend e views geradas')
    .option('--no-render', 'Nao gera views Markdown apos a inicializacao')
    .action(async (targetPath = '.', options?: SddInitCliOptions) => {
      const command = new SddInitCommand();
      const result = await command.execute(targetPath, {
        frontendEnabled: options?.frontend,
        render: options?.render,
      });

      console.log(chalk.green('SDD inicializado com sucesso.'));
      console.log(`Diretorio de memoria: ${result.memoryDir}`);
      console.log(`Modulo de frontend: ${result.frontendEnabled ? 'ativado' : 'desativado'}`);
      console.log(`Views geradas: ${result.rendered ? 'sim' : 'nao'}`);
    });

  sddCmd
    .command('check [path]')
    .description('Valida arquivos de estado .sdd e opcionalmente gera views')
    .option('--render', 'Gera views Markdown apos validacao bem-sucedida')
    .option('--json', 'Retorna relatorio em JSON')
    .action(async (targetPath = '.', options?: SddCheckCliOptions) => {
      const command = new SddCheckCommand();
      const report = await command.execute(targetPath, {
        render: options?.render,
      });

      if (options?.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(`Valido: ${report.valid ? 'sim' : 'nao'}`);
        console.log(`Registros de discovery: ${report.summary.discovery}`);
        console.log(`Itens de backlog: ${report.summary.backlog}`);
        console.log(`Itens de divida tecnica: ${report.summary.techDebt}`);
        console.log(`Itens na fila de finalize: ${report.summary.finalizeQueue}`);
        console.log(`Frontend ativado: ${report.summary.frontendEnabled ? 'sim' : 'nao'}`);
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
    .action(async (targetPath = '.', options?: { json?: boolean }) => {
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
    .command('suggest [path]')
    .description('Sugere skills por contexto (fase, dominio e bundle)')
    .option('--phase <phase>', 'Fase da tarefa: discover|plan|execute|verify|finalize')
    .option('--domains <list>', 'Dominios separados por virgula (ex: backend,security,api)')
    .option('--bundles <list>', 'Bundles separados por virgula')
    .option('--max <n>', 'Quantidade maxima de sugestoes (padrao: 5)')
    .option('--json', 'Retorna resultado em JSON')
    .action(async (targetPath = '.', options?: SddSkillsSuggestCliOptions) => {
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
        console.log(
          JSON.stringify(
            ranked.map((entry) => ({
              id: entry.skill.id,
              title: entry.skill.title,
              score: entry.score,
              reasons: entry.reasons,
              bundles: entry.skill.bundle_ids,
              domains: entry.skill.domains,
              phases: entry.skill.phases,
            })),
            null,
            2
          )
        );
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
}
