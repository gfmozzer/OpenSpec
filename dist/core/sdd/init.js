import { loadProjectSddConfig, loadStateSnapshot, ensureBaseFiles, ensureBaseStructure, resolveSddPaths, upsertProjectSddConfig, } from './state.js';
import { renderViews } from './views.js';
import { syncSddGuideDocs } from './docs-sync.js';
import { bootstrapInitialContext } from './bootstrap.js';
import { SddSkillsSyncCommand } from './operations.js';
export class SddInitCommand {
    async execute(projectRoot, options = {}) {
        const config = await upsertProjectSddConfig(projectRoot, {
            frontendEnabled: options.frontendEnabled,
            language: options.language,
            layout: options.layout,
        });
        const paths = resolveSddPaths(projectRoot, config);
        await ensureBaseStructure(paths);
        await ensureBaseFiles(paths, config);
        const contextBootstrap = await bootstrapInitialContext(projectRoot, paths, config, {
            mode: 'empty-only',
            deep: false,
        });
        const skillsSync = await new SddSkillsSyncCommand().execute(projectRoot, { all: true });
        const shouldRender = options.render ?? config.views.autoRender;
        if (shouldRender) {
            const state = await loadStateSnapshot(paths, config);
            await renderViews(paths, config, state);
        }
        await syncSddGuideDocs(projectRoot, paths, config);
        return {
            projectRoot,
            memoryDir: paths.memoryRoot,
            frontendEnabled: config.frontend.enabled,
            rendered: shouldRender,
            skillsSeeded: skillsSync.synced,
            localSkillsMaterialized: skillsSync.local_synced,
            syncedTools: skillsSync.tools,
            contextBootstrap,
        };
    }
}
export class SddInitContextCommand {
    async execute(projectRoot, options = {}) {
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
        await syncSddGuideDocs(projectRoot, paths, config);
        return {
            projectRoot,
            memoryDir: paths.memoryRoot,
            rendered: shouldRender,
            contextBootstrap,
        };
    }
}
//# sourceMappingURL=init.js.map