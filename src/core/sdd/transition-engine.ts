import { BacklogItem } from './types.js';

export type EntityStatus = string;

export class TransitionEngine {
  private static allowedTransitions: Record<string, Record<EntityStatus, EntityStatus[]>> = {
    INS: {
      NEW: ['DEBATED', 'DISCARDED'],
    },
    DEB: {
      OPEN: ['APPROVED', 'DISCARDED'],
    },
    EPIC: {
      READY: ['PLANNED', 'SPLIT', 'IN_PROGRESS', 'ARCHIVED'],
      PLANNED: ['IN_PROGRESS', 'ARCHIVED'],
      SPLIT: ['ARCHIVED'],
      IN_PROGRESS: ['DONE', 'ARCHIVED'],
    },
    RAD: {
      READY: ['PLANNED', 'SPLIT', 'IN_PROGRESS', 'ARCHIVED'],
      PLANNED: ['IN_PROGRESS', 'ARCHIVED'],
      SPLIT: ['ARCHIVED'],
      IN_PROGRESS: ['DONE', 'ARCHIVED'],
    },
    FEAT: {
      READY: ['IN_PROGRESS', 'BLOCKED', 'ARCHIVED'],
      BLOCKED: ['READY', 'ARCHIVED'],
      IN_PROGRESS: ['DONE', 'BLOCKED', 'ARCHIVED'],
    },
  };

  /**
   * Valida se a transição de estado desejada é logicamente permitida pelo grafo de transições.
   */
  static assertValid(entityType: string, fromStatus: EntityStatus, toStatus: EntityStatus): void {
    const typeGraph = this.allowedTransitions[entityType];
    if (!typeGraph) {
      throw new Error(`Tipo de entidade não reconhecido pelo motor de transição: ${entityType}`);
    }

    const permittedTargets = typeGraph[fromStatus];
    if (!permittedTargets) {
      throw new Error(`Status de origem '${fromStatus}' inválido para a entidade ${entityType}.`);
    }

    if (!permittedTargets.includes(toStatus)) {
      throw new Error(
        `Transição estrutural bloqueada (Transition Engine): ${entityType} não pode transitar de '${fromStatus}' para '${toStatus}'. (Permitidos: ${permittedTargets.join(', ')})`
      );
    }
  }

  /**
   * Validações de negócio granulares antes de finalizações ou progressos de FEAT.
   */
  static validateFeatureStartGuardrails(feature: BacklogItem): Record<string, any> {
    // Estas são verificações já implementadas parcialmente nas operações,
    // mas a extração as prepara para regras mais determinísticas futuramente.
    return {
      forced: false,
      lock_check: { ok: true, conflicts: [] },
      blocked_check: { ok: true, unresolved: [] },
    };
  }
}
