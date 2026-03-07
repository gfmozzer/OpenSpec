import { loadStateSnapshot, ensureBaseFiles, ensureBaseStructure, resolveSddPaths, upsertProjectSddConfig, type SddRuntimeConfig } from './state.js';
import { renderViews } from './views.js';

export interface SddInitOptions {
  frontendEnabled?: boolean;
  render?: boolean;
}

export interface SddInitResult {
  projectRoot: string;
  memoryDir: string;
  frontendEnabled: boolean;
  rendered: boolean;
}

export class SddInitCommand {
  async execute(projectRoot: string, options: SddInitOptions = {}): Promise<SddInitResult> {
    const config: SddRuntimeConfig = await upsertProjectSddConfig(projectRoot, {
      frontendEnabled: options.frontendEnabled,
    });
    const paths = resolveSddPaths(projectRoot, config);

    await ensureBaseStructure(paths);
    await ensureBaseFiles(paths, config);

    const shouldRender = options.render ?? config.views.autoRender;
    if (shouldRender) {
      const state = await loadStateSnapshot(paths, config);
      await renderViews(paths, config, state);
    }

    return {
      projectRoot,
      memoryDir: paths.memoryRoot,
      frontendEnabled: config.frontend.enabled,
      rendered: shouldRender,
    };
  }
}
