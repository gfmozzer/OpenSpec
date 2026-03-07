import { Command } from 'commander';
import chalk from 'chalk';
import { SddInitCommand } from '../core/sdd/init.js';
import { SddCheckCommand } from '../core/sdd/check.js';

interface SddInitCliOptions {
  frontend?: boolean;
  render?: boolean;
}

interface SddCheckCliOptions {
  render?: boolean;
  json?: boolean;
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
}
