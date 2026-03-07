# Installation

## Prerequisites

- **Node.js 20.19.0 or higher** - Check your version: `node --version`

## Official install (npm)

```bash
npm install -g @gfmozzer/opensdd
```

## Verify installation

```bash
opensdd --version
```

## Initialize in a new project

```bash
cd your-project
opensdd install --tools none
```

Optional full tool setup:

```bash
opensdd install --tools all
```

## Existing project bootstrap

```bash
opensdd sdd init-context
opensdd sdd check --render
opensdd sdd onboard system
```

## Fallback install from tarball

Use this fallback if npm registry install is unavailable:

```bash
pnpm run build
npm pack
npm install -g ./gfmozzer-opensdd-<version>.tgz
```

## Troubleshooting (Windows)

If `opensdd --version` fails after a global install, clean stale global links and reinstall:

```powershell
npm uninstall -g @gfmozzer/opensdd
Remove-Item "$env:APPDATA\\npm\\opensdd*" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:APPDATA\\npm\\node_modules\\@gfmozzer\\opensdd" -Recurse -Force -ErrorAction SilentlyContinue
npm cache clean --force
npm install -g @gfmozzer/opensdd
opensdd --version
```

## Nix

Run directly:

```bash
nix run github:gfmozzer/OpenSpec -- --version
```

Install to profile:

```bash
nix profile install github:gfmozzer/OpenSpec
```
