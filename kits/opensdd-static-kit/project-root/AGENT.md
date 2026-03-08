# AGENT

<!-- SDD:ROOT-AGENTS:START -->
## SDD Operational Contract

Agents working in this repository must treat documentation sync as part of feature completion.

Required execution order:
1. Run `opensdd sdd onboard system` before broad work.
2. Run `opensdd sdd start FEAT-###` before implementation.
3. Use `opensdd sdd context FEAT-###` before coding.
4. Before archive/finalize, update the documentation affected by the feature:
   - `README.md`
   - `.sdd/AGENT.md`
   - `.sdd/core/*.md`
   - `AGENTS.md`
   - `AGENT.md`
5. Run `opensdd sdd finalize --ref FEAT-###` to consolidate memory.

Canonical state lives in `.sdd/state/*.yaml`. Markdown files are operational views or guides derived from that state.
<!-- SDD:ROOT-AGENTS:END -->
