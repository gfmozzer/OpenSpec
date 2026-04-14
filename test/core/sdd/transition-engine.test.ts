import { describe, expect, it } from 'vitest';
import { TransitionEngine } from '../../../src/core/sdd/transition-engine.js';

describe('TransitionEngine', () => {
  it('aceita uma transicao estrutural valida', () => {
    expect(() => TransitionEngine.assertValid('FEAT', 'READY', 'IN_PROGRESS')).not.toThrow();
  });

  it('rejeita tipo de entidade desconhecido', () => {
    expect(() => TransitionEngine.assertValid('XYZ', 'READY', 'DONE')).toThrow(
      'Tipo de entidade não reconhecido pelo motor de transição: XYZ'
    );
  });

  it('rejeita status de origem invalido para o tipo', () => {
    expect(() => TransitionEngine.assertValid('INS', 'READY', 'DEBATED')).toThrow(
      "Status de origem 'READY' inválido para a entidade INS."
    );
  });

  it('rejeita transicao nao permitida e informa os destinos aceitos', () => {
    expect(() => TransitionEngine.assertValid('DEB', 'OPEN', 'DONE')).toThrow(
      "Transição estrutural bloqueada (Transition Engine): DEB não pode transitar de 'OPEN' para 'DONE'. (Permitidos: APPROVED, DISCARDED)"
    );
  });

  it('retorna guardrails padrao ao iniciar uma feature', () => {
    const result = TransitionEngine.validateFeatureStartGuardrails({
      id: 'FEAT-0010',
      title: 'Elevar cobertura',
      status: 'READY',
    } as any);

    expect(result).toEqual({
      forced: false,
      lock_check: { ok: true, conflicts: [] },
      blocked_check: { ok: true, unresolved: [] },
    });
  });
});
