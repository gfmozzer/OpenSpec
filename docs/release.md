# Release and Rollback Guide

This repository is prepared for public release through GitHub Actions + Changesets.

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
- `license` is `MIT`
- `files` only includes the intended publish surface

4. Confirm repository settings before first public publish:
- npm trusted publishing / OIDC configured
- required GitHub Actions permissions enabled
- `CODEOWNERS`, `SECURITY.md` and support docs reviewed

5. Merge to `main` and let the release workflow open/update the version PR and publish after merge.

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

## Public repository hygiene

Before cutting a release, confirm that the diff does not include:

- IDE-specific files
- local credentials
- debug logs
- ad hoc test fixtures with real data
- unpublished draft docs that conflict with the canonical README

## Windows recovery (broken global install)

```powershell
npm uninstall -g @gfmozzer/opensdd
Remove-Item "$env:APPDATA\\npm\\opensdd*" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:APPDATA\\npm\\node_modules\\@gfmozzer\\opensdd" -Recurse -Force -ErrorAction SilentlyContinue
npm cache clean --force
npm install -g @gfmozzer/opensdd
opensdd --version
```
