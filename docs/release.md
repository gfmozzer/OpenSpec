# Release and Rollback Guide

## Release checklist

1. Ensure working tree is clean.
2. Run:

```bash
pnpm install
pnpm run build
pnpm run check:pack-version
pnpm vitest run test/commands/feedback.test.ts
```

3. Verify package metadata:
- `name` is `@gfmozzer/opensdd`
- `bin.opensdd` points to `./bin/opensdd.js`

4. Merge to `main` and let release workflow publish.

## Manual fallback release (tarball)

```bash
pnpm run build
npm pack
```

This creates `gfmozzer-opensdd-<version>.tgz`.

Install locally for smoke test:

```bash
npm install -g ./gfmozzer-opensdd-<version>.tgz --force
opensdd --version
```

## Smoke test after publish

```bash
npm install -g @gfmozzer/opensdd
opensdd --version
mkdir -p /tmp/opensdd-smoke && cd /tmp/opensdd-smoke
opensdd install --tools none
```

Expected minimum outputs:
- `.sdd/`
- `.sdd/state/source-index.yaml`
- `.sdd/skills/curated/`
- `.sdd/templates/`
- `AGENT.md`, `AGENTS.md`, `README.md`

## Rollback strategy

1. Deprecate broken version in npm:

```bash
npm deprecate @gfmozzer/opensdd@<broken-version> "Broken install. Use <fixed-version>."
```

2. Cut a patch release with fix.
3. Publish and update release notes with migration instructions.

## Windows recovery (broken global install)

```powershell
npm uninstall -g @gfmozzer/opensdd
Remove-Item "$env:APPDATA\\npm\\opensdd*" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:APPDATA\\npm\\node_modules\\@gfmozzer\\opensdd" -Recurse -Force -ErrorAction SilentlyContinue
npm cache clean --force
npm install -g @gfmozzer/opensdd
opensdd --version
```
