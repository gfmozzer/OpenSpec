# OpenSpec Agent Guide (AGENT.md)

This file mirrors `AGENTS.md` for tools that still require the singular filename.

## Scope

- Applies to the whole repository.
- If a subfolder has another `AGENTS.md`, the nearest file should take precedence for that scope.

## Preferred Language

- Default interaction language: **Português do Brasil (pt-BR)** unless the user asks for another language.

## Dev Environment Tips

- Node.js: `>=20.19.0`
- Package manager: `pnpm`
- Install deps: `pnpm install`
- Build output goes to `dist/`.
- Main CLI entrypoint: `bin/openspec.js`

## Build, Test, Lint Commands

- Build: `pnpm run build`
- Full tests: `pnpm test`
- Watch tests: `pnpm run test:watch`
- Coverage: `pnpm run test:coverage`
- Lint: `pnpm run lint`
- Local CLI dev loop: `pnpm run dev:cli`

## Project Structure

- `src/`: core TypeScript source
- `src/commands/`: CLI command handlers
- `src/core/`: business logic
- `src/core/sdd/`: SDD memory/planning workflow
- `openspec/`: project config/templates/runtime files
- `docs/`: human documentation
- `test/`: Vitest suites

## SDD Workflow (What agents should use)

<!-- SDD:ROOT-AGENTS:START -->
## SDD Operational Contract

Agents working in this repository must treat documentation sync as part of feature completion.

Required execution order:
1. Run `openspec sdd onboard system` before broad work.
2. Run `openspec sdd start FEAT-###` before implementation.
3. Use `openspec sdd context FEAT-###` before coding.
4. Before archive/finalize, update the documentation affected by the feature:
   - `README.md`
   - `.sdd/agente.md`
   - `.sdd/core/*.md`
   - `AGENTS.md`
   - `AGENT.md`
5. Run `openspec sdd finalize --ref FEAT-###` to consolidate memory.

Canonical state lives in `.sdd/state/*.yaml`. Markdown files are operational views or guides derived from that state.
<!-- SDD:ROOT-AGENTS:END -->

For planning/execution memory and handoff, prefer these commands:

1. `openspec sdd init --frontend`
2. `openspec sdd check --render`
3. `openspec sdd onboard system`
4. `openspec sdd next`
5. `openspec sdd start FEAT-###`
6. `openspec sdd context FEAT-###`
7. `openspec sdd finalize --ref FEAT-###`

Discovery pipeline for ideas:

1. `openspec sdd insight "..."`
2. `openspec sdd debate INS-###`
3. `openspec sdd decide DEB-### --outcome radar|discard`
4. `openspec sdd breakdown RAD-### --mode graph --incremental`

## Coding Guidelines

- Keep changes minimal and scoped to the task.
- Preserve backward compatibility unless explicitly asked to break it.
- Update tests whenever behavior changes.
- Prefer YAML state as source of truth in SDD (`.sdd/state/*.yaml`), with Markdown views generated from state.
- Do not edit generated artifacts manually when there is a render/sync command for them.

## Validation Before Finishing

- Run targeted tests for changed modules first.
- Run `pnpm run build` before finalizing.
- If command/API behavior changed, add or update tests in `test/core` or `test/commands`.

## Pull Request / Commit Guidance

- Use clear, scoped commit messages (Conventional Commits style is preferred by this repo).
- Mention test evidence in PR description.
- Keep docs in sync when command behavior changes (`README.md`, `docs/`, `.sdd/` when applicable).
