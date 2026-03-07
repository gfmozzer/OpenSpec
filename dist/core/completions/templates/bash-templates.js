/**
 * Static template strings for Bash completion scripts.
 * These are Bash-specific helper functions that never change.
 */
export const BASH_DYNAMIC_HELPERS = `# Dynamic completion helpers

_openspec_complete_changes() {
  local changes
  changes=$(opensdd __complete changes 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$changes" -- "$cur"))
}

_openspec_complete_specs() {
  local specs
  specs=$(opensdd __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$specs" -- "$cur"))
}

_openspec_complete_items() {
  local items
  items=$(opensdd __complete changes 2>/dev/null | cut -f1; opensdd __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$items" -- "$cur"))
}`;
//# sourceMappingURL=bash-templates.js.map