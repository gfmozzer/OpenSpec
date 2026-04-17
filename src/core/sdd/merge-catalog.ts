import type {
  ArchitectureNode,
  FrontendDecisionRecord,
  RepoMapRecord,
  ServiceRecord,
  TechStackRecord,
} from './types.js';

export function stableUniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value && value.trim().length > 0)));
}

function preferExisting(existing?: string | null, incoming?: string | null): string {
  const existingValue = existing?.trim() || '';
  if (existingValue) return existingValue;
  return incoming?.trim() || '';
}

export function upsertByKey<T>(
  items: T[],
  incoming: T,
  keyFor: (item: T) => string,
  merge: (existing: T, next: T) => T
): void {
  const index = items.findIndex((item) => keyFor(item) === keyFor(incoming));
  if (index < 0) {
    items.push(incoming);
    return;
  }

  items[index] = merge(items[index], incoming);
}

export function mergeArchitectureNode(
  existing: ArchitectureNode,
  incoming: ArchitectureNode
): ArchitectureNode {
  return {
    ...existing,
    name: preferExisting(existing.name, incoming.name),
    kind: preferExisting(existing.kind, incoming.kind),
    description: preferExisting(existing.description, incoming.description),
    repo_paths: stableUniqueStrings([...existing.repo_paths, ...incoming.repo_paths]),
    depends_on: stableUniqueStrings([...existing.depends_on, ...incoming.depends_on]),
  };
}

export function mergeServiceRecord(existing: ServiceRecord, incoming: ServiceRecord): ServiceRecord {
  return {
    ...existing,
    name: preferExisting(existing.name, incoming.name),
    responsibility: preferExisting(existing.responsibility, incoming.responsibility),
    owner_refs: stableUniqueStrings([...existing.owner_refs, ...incoming.owner_refs]),
    repo_paths: stableUniqueStrings([...existing.repo_paths, ...incoming.repo_paths]),
    contracts: stableUniqueStrings([...existing.contracts, ...incoming.contracts]),
    external_dependencies: stableUniqueStrings([
      ...existing.external_dependencies,
      ...incoming.external_dependencies,
    ]),
  };
}

export function mergeTechStackRecord(existing: TechStackRecord, incoming: TechStackRecord): TechStackRecord {
  return {
    ...existing,
    version: preferExisting(existing.version, incoming.version),
    purpose: preferExisting(existing.purpose, incoming.purpose),
    constraints: stableUniqueStrings([...existing.constraints, ...incoming.constraints]),
  };
}

export function mergeRepoMapRecord(existing: RepoMapRecord, incoming: RepoMapRecord): RepoMapRecord {
  return {
    ...existing,
    kind: preferExisting(existing.kind, incoming.kind),
    service_ref: preferExisting(existing.service_ref, incoming.service_ref),
    notes: preferExisting(existing.notes, incoming.notes),
  };
}

export function mergeFrontendDecisionRecord(
  existing: FrontendDecisionRecord,
  incoming: FrontendDecisionRecord
): FrontendDecisionRecord {
  return {
    ...existing,
    title: preferExisting(existing.title, incoming.title),
    status: existing.status || incoming.status,
    decision: preferExisting(existing.decision, incoming.decision),
    rationale: preferExisting(existing.rationale, incoming.rationale),
    related_refs: stableUniqueStrings([...existing.related_refs, ...incoming.related_refs]),
    route_refs: stableUniqueStrings([...existing.route_refs, ...incoming.route_refs]),
    adr_refs: stableUniqueStrings([...existing.adr_refs, ...incoming.adr_refs]),
  };
}
