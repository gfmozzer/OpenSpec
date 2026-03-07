import {
  loadProjectSddConfig,
  loadStateSnapshot,
  ensureBaseFiles,
  ensureBaseStructure,
  resolveSddPaths,
  upsertProjectSddConfig,
  type SddRuntimeConfig,
} from './state.js';
import { renderViews } from './views.js';
import { syncSddGuideDocs } from './docs-sync.js';
import { bootstrapInitialContext, type BootstrapContextReport } from './bootstrap.js';

export interface SddInitOptions {
  frontendEnabled?: boolean;
  render?: boolean;
}

export interface SddInitResult {
  projectRoot: string;
  memoryDir: string;
  frontendEnabled: boolean;
  rendered: boolean;
  contextBootstrap: BootstrapContextReport;
}

export interface SddInitContextOptions {
  mode?: 'merge' | 'replace';
  deep?: boolean;
  render?: boolean;
}

export interface SddInitContextResult {
  projectRoot: string;
  memoryDir: string;
  rendered: boolean;
  contextBootstrap: BootstrapContextReport;
}

export class SddInitCommand {
  async execute(projectRoot: string, options: SddInitOptions = {}): Promise<SddInitResult> {
    const config: SddRuntimeConfig = await upsertProjectSddConfig(projectRoot, {
      frontendEnabled: options.frontendEnabled,
    });
    const paths = resolveSddPaths(projectRoot, config);

    await ensureBaseStructure(paths);
    await ensureBaseFiles(paths, config);
    const contextBootstrap = await bootstrapInitialContext(projectRoot, paths, config, {
      mode: 'empty-only',
      deep: false,
    });

    const shouldRender = options.render ?? config.views.autoRender;
    if (shouldRender) {
      const state = await loadStateSnapshot(paths, config);
      await renderViews(paths, config, state);
    }
    await syncSddGuideDocs(projectRoot, paths);

    return {
      projectRoot,
      memoryDir: paths.memoryRoot,
      frontendEnabled: config.frontend.enabled,
      rendered: shouldRender,
      contextBootstrap,
    };
  }
}

export class SddInitContextCommand {
  async execute(projectRoot: string, options: SddInitContextOptions = {}): Promise<SddInitContextResult> {
    const config = await loadProjectSddConfig(projectRoot);
    const paths = resolveSddPaths(projectRoot, config);

    await ensureBaseStructure(paths);
    await ensureBaseFiles(paths, config);

    const contextBootstrap = await bootstrapInitialContext(projectRoot, paths, config, {
      mode: options.mode || 'merge',
      deep: options.deep ?? true,
    });

    const shouldRender = options.render ?? config.views.autoRender;
    if (shouldRender) {
      const state = await loadStateSnapshot(paths, config);
      await renderViews(paths, config, state);
    }
    await syncSddGuideDocs(projectRoot, paths);

    return {
      projectRoot,
      memoryDir: paths.memoryRoot,
      rendered: shouldRender,
      contextBootstrap,
    };
  }
}
