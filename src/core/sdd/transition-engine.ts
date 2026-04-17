import { BacklogItem, TransitionLogEvent } from './types.js';

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
      SPLIT: ['DONE', 'ARCHIVED'],
      IN_PROGRESS: ['DONE', 'ARCHIVED'],
      DONE: ['ARCHIVED'],
    },
    RAD: {
      READY: ['PLANNED', 'SPLIT', 'IN_PROGRESS', 'ARCHIVED'],
      PLANNED: ['IN_PROGRESS', 'ARCHIVED'],
      SPLIT: ['DONE', 'ARCHIVED'],
      IN_PROGRESS: ['DONE', 'ARCHIVED'],
      DONE: ['ARCHIVED'],
    },
    FEAT: {
      READY: ['IN_PROGRESS', 'BLOCKED', 'ARCHIVED'],
      BLOCKED: ['READY', 'IN_PROGRESS', 'ARCHIVED'],
      IN_PROGRESS: ['DONE', 'BLOCKED', 'ARCHIVED'],
      DONE: ['ARCHIVED'],
      ARCHIVED: [],
    },
  };

  /**
   * Valida se a transição de estado desejada é logicamente permitida pelo grafo de transições,
   * e bloqueia transições caso haja violações arquiteturais ou de lente documental.
   */
  static assertValid(
    entityType: string,
    fromStatus: EntityStatus,
    toStatus: EntityStatus,
    options?: {
      forceTransition?: boolean;
      lensViolations?: string[];
    }
  ): void {
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

    if (options?.lensViolations && options.lensViolations.length > 0) {
      if (!options.forceTransition) {
        throw new Error(
          `Transição de estado negada. Artefatos bloqueados pelas Lentes Estruturais:\n- ${options.lensViolations.join('\n- ')}\n\nUtilize a flag --force-transition se julgar tratar-se de um bypass válido.`
        );
      } else {
        console.warn(`[WARNING] Transição forçada de ${entityType} para ${toStatus} ignorando as seguintes violações de Lente:\n- ${options.lensViolations.join('\n- ')}`);
      }
    }
  }

  static applyTransition<T extends { id: string; status: EntityStatus }>(
    entityType: string,
    entity: T,
    toStatus: EntityStatus,
    transitionLog: TransitionLogEvent[],
    options?: {
      actor?: string;
      reason?: string;
      timestamp?: string;
      sourceCommand?: string;
      forceTransition?: boolean;
      lensViolations?: string[];
      afterTransition?: (entity: T) => void;
    }
  ): TransitionLogEvent {
    const fromStatus = entity.status;
    this.assertValid(entityType, fromStatus, toStatus, options);

    const event: TransitionLogEvent = {
      entity_type: entityType,
      entity_id: entity.id,
      from: fromStatus,
      to: toStatus,
      actor: options?.actor || 'system',
      reason: options?.reason || '',
      timestamp: options?.timestamp || new Date().toISOString(),
      source_command: options?.sourceCommand || 'unknown',
      force_transition: Boolean(options?.forceTransition),
      lens_violations: options?.lensViolations || [],
    };

    entity.status = toStatus;
    options?.afterTransition?.(entity);
    transitionLog.push(event);
    return event;
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
