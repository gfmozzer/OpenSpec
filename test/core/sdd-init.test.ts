import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { SddInitCommand, SddInitContextCommand } from '../../src/core/sdd/init.js';

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

describe('SddInitCommand', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-sdd-init-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('creates .sdd baseline files and updates openspec/config.yaml', async () => {
    const command = new SddInitCommand();
    const result = await command.execute(testDir);

    expect(await exists(path.join(testDir, '.sdd'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'discovery-index.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'backlog.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'tech-debt.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'finalize-queue.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'skill-catalog.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'skills', 'bundles', 'curadoria-pt-br.md'))).toBe(true);
    expect(
      await exists(
        path.join(testDir, '.sdd', 'skills', 'curated', 'repo-context-bootstrap', 'SKILL.md')
      )
    ).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'architecture.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'service-catalog.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'tech-stack.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'integration-contracts.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'repo-map.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'core', 'index.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'core', 'servicos.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'core', 'spec-tecnologica.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'core', 'repo-map.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'pendencias', 'backlog-features.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'agente.md'))).toBe(true);
    expect(await exists(path.join(testDir, 'README.md'))).toBe(true);
    expect(await exists(path.join(testDir, 'AGENTS.md'))).toBe(true);
    expect(await exists(path.join(testDir, 'AGENT.md'))).toBe(true);

    const skillCatalog = parseYaml(
      await fs.readFile(path.join(testDir, '.sdd', 'state', 'skill-catalog.yaml'), 'utf-8')
    ) as Record<string, any>;
    expect(skillCatalog.skills).toHaveLength(60);
    expect(skillCatalog.bundles).toHaveLength(6);
    expect(result.skillsSeeded).toBe(60);
    expect(result.localSkillsMaterialized).toBe(60);

    const projectConfig = await fs.readFile(path.join(testDir, 'openspec', 'config.yaml'), 'utf-8');
    const parsed = parseYaml(projectConfig) as Record<string, any>;
    expect(parsed.sdd).toBeDefined();
    expect(parsed.sdd.enabled).toBe(true);
    expect(parsed.sdd.memoryDir).toBe('.sdd');
    expect(parsed.sdd.frontend.enabled).toBe(false);

    // Frontend files should not exist by default
    expect(await exists(path.join(testDir, '.sdd', 'state', 'frontend-gaps.yaml'))).toBe(false);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'frontend-map.yaml'))).toBe(false);
  });

  it('creates frontend state files when frontend module is enabled', async () => {
    const command = new SddInitCommand();
    const result = await command.execute(testDir, { frontendEnabled: true });

    expect(result.frontendEnabled).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'frontend-gaps.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'frontend-map.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'frontend-decisions.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'core', 'frontend-map.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'core', 'frontend-decisions.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'pendencias', 'frontend-gaps.md'))).toBe(true);
  });

  it('is idempotent and does not overwrite existing state files', async () => {
    const command = new SddInitCommand();
    await command.execute(testDir);

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlogRaw = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    backlogRaw.items = [
      {
        id: 'FEAT-001',
        title: 'Existing item',
        status: 'READY',
        origin_type: 'direct',
        blocked_by: [],
        touches: [],
        lock_domains: [],
        recommended_skills: [],
        frontend_gap_refs: [],
        spec_refs: [],
      },
    ];
    await fs.writeFile(backlogPath, stringifyYaml(backlogRaw), 'utf-8');

    await command.execute(testDir);
    const updated = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].id).toBe('FEAT-001');
  });

  it('migrates legacy empty skill catalog to curated defaults', async () => {
    const command = new SddInitCommand();
    await command.execute(testDir);

    const catalogPath = path.join(testDir, '.sdd', 'state', 'skill-catalog.yaml');
    await fs.writeFile(catalogPath, stringifyYaml({ version: 1, skills: [], bundles: [] }), 'utf-8');

    await command.execute(testDir);

    const migrated = parseYaml(await fs.readFile(catalogPath, 'utf-8')) as Record<string, any>;
    expect(migrated.skills).toHaveLength(60);
    expect(migrated.bundles).toHaveLength(6);
  });

  it('bootstraps initial architecture, stack and repo map from an existing project', async () => {
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(
        {
          name: 'petflow-api',
          dependencies: {
            '@nestjs/core': '^11.0.0',
            '@nestjs/common': '^11.0.0',
            '@prisma/client': '^6.0.0',
          },
          devDependencies: {
            typescript: '^5.9.3',
            vitest: '^3.2.4',
          },
          engines: {
            node: '>=20.19.0',
          },
        },
        null,
        2
      ),
      'utf-8'
    );
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'tsconfig.json'), '{"compilerOptions":{"target":"ES2022"}}', 'utf-8');

    const command = new SddInitCommand();
    await command.execute(testDir, { render: false });

    const techStack = parseYaml(
      await fs.readFile(path.join(testDir, '.sdd', 'state', 'tech-stack.yaml'), 'utf-8')
    ) as Record<string, any>;
    const architecture = parseYaml(
      await fs.readFile(path.join(testDir, '.sdd', 'state', 'architecture.yaml'), 'utf-8')
    ) as Record<string, any>;
    const repoMap = parseYaml(
      await fs.readFile(path.join(testDir, '.sdd', 'state', 'repo-map.yaml'), 'utf-8')
    ) as Record<string, any>;

    expect(techStack.items.some((item: any) => item.technology === 'nestjs')).toBe(true);
    expect(techStack.items.some((item: any) => item.technology === 'typescript')).toBe(true);
    expect(architecture.nodes.some((item: any) => item.name === 'petflow-api')).toBe(true);
    expect(repoMap.items.some((item: any) => item.path === 'src')).toBe(true);
  });

  it('supports deep init-context merge for an existing repository', async () => {
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(
        {
          name: 'chatwoot-custom',
          dependencies: {
            react: '^19.0.0',
            redis: '^5.0.0',
          },
        },
        null,
        2
      ),
      'utf-8'
    );
    await fs.mkdir(path.join(testDir, 'apps', 'api'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'apps', 'web'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'docker-compose.yml'),
      'services:\n  redis:\n    image: redis:7\n',
      'utf-8'
    );

    await new SddInitCommand().execute(testDir, { render: false });
    const context = await new SddInitContextCommand().execute(testDir, {
      mode: 'merge',
      deep: true,
      render: false,
    });

    expect(context.contextBootstrap.deep).toBe(true);
    expect(context.contextBootstrap.updated.repo_map).toBe(true);

    const repoMap = parseYaml(
      await fs.readFile(path.join(testDir, '.sdd', 'state', 'repo-map.yaml'), 'utf-8')
    ) as Record<string, any>;
    const serviceCatalog = parseYaml(
      await fs.readFile(path.join(testDir, '.sdd', 'state', 'service-catalog.yaml'), 'utf-8')
    ) as Record<string, any>;
    const contracts = parseYaml(
      await fs.readFile(path.join(testDir, '.sdd', 'state', 'integration-contracts.yaml'), 'utf-8')
    ) as Record<string, any>;

    expect(repoMap.items.some((item: any) => item.path === 'apps/api')).toBe(true);
    expect(serviceCatalog.services.some((item: any) => item.id === 'api')).toBe(true);
    expect(contracts.contracts).toContain('infra:redis');
  });
});
