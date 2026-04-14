import { BacklogItem } from './types.js';
export type EntityStatus = string;
export declare class TransitionEngine {
    private static allowedTransitions;
    /**
     * Valida se a transição de estado desejada é logicamente permitida pelo grafo de transições,
     * e bloqueia transições caso haja violações arquiteturais ou de lente documental.
     */
    static assertValid(entityType: string, fromStatus: EntityStatus, toStatus: EntityStatus, options?: {
        forceTransition?: boolean;
        lensViolations?: string[];
    }): void;
    /**
     * Validações de negócio granulares antes de finalizações ou progressos de FEAT.
     */
    static validateFeatureStartGuardrails(feature: BacklogItem): Record<string, any>;
}
//# sourceMappingURL=transition-engine.d.ts.map