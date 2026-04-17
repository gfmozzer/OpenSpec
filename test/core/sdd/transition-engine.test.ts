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

  it('bloqueia rollback estrutural de FEAT arquivada para DONE', () => {
    expect(() => TransitionEngine.assertValid('FEAT', 'ARCHIVED', 'DONE')).toThrow(
      "Transição estrutural bloqueada (Transition Engine): FEAT não pode transitar de 'ARCHIVED' para 'DONE'. (Permitidos: )"
    );
  });

  it('aplica transicao e registra evento append-only no log', () => {
    const transitionLog: any[] = [];
    const feature = { id: 'FEAT-0020', status: 'READY' };

    const event = TransitionEngine.applyTransition('FEAT', feature, 'IN_PROGRESS', transitionLog, {
      sourceCommand: 'sdd start',
      actor: 'codex',
      reason: 'Inicio da feature',
      timestamp: '2026-04-16T00:00:00.000Z',
    });

    expect(feature.status).toBe('IN_PROGRESS');
    expect(transitionLog).toHaveLength(1);
    expect(event).toMatchObject({
      entity_type: 'FEAT',
      entity_id: 'FEAT-0020',
      from: 'READY',
      to: 'IN_PROGRESS',
      actor: 'codex',
      reason: 'Inicio da feature',
      source_command: 'sdd start',
    });
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
