import { describe, it, expect } from 'vitest';
import { evaluatePredicate, evaluateRules, guardTransition } from '../../../src/domain/rules.js';

const lifecycle = {
  statusLifecycle: {
    statuses: ['planificada', 'liberada', 'terminada'],
    transitions: {
      planificada: ['liberada'],
      liberada: ['terminada'],
      terminada: []
    }
  }
};

const config = {
  ...lifecycle,
  domain: {
    rules: [
      {
        target: 'document',
        when: { field: 'status', op: 'eq', value: 'terminada' },
        require: { field: 'qualityResult', op: 'eq', value: 'Aprobado' },
        message: 'Una orden terminada debe tener calidad Aprobada.'
      },
      {
        target: 'entity',
        when: { field: 'currentStock', op: 'exists' },
        require: { field: 'currentStock', op: 'gte', value: 0 },
        message: 'El stock no puede ser negativo.'
      }
    ],
    transitionGuards: [
      {
        from: 'liberada',
        to: 'terminada',
        require: { field: 'qualityResult', op: 'eq', value: 'Aprobado' },
        message: 'Solo se termina con calidad aprobada.'
      }
    ]
  }
};

describe('evaluatePredicate', () => {
  it('compares text and numeric values', () => {
    expect(evaluatePredicate({ field: 'status', op: 'eq', value: 'liberada' }, { status: 'liberada' })).toBe(true);
    expect(evaluatePredicate({ field: 'quantity', op: 'eq', value: 5 }, { quantity: '5' })).toBe(true);
  });

  it('supports inequality, membership and comparisons', () => {
    const record = { status: 'liberada', quantity: 5 };
    expect(evaluatePredicate({ field: 'status', op: 'neq', value: 'terminada' }, record)).toBe(true);
    expect(evaluatePredicate({ field: 'status', op: 'in', value: ['liberada', 'terminada'] }, record)).toBe(true);
    expect(evaluatePredicate({ field: 'status', op: 'notIn', value: ['terminada'] }, record)).toBe(true);
    expect(evaluatePredicate({ field: 'quantity', op: 'lt', value: 10 }, record)).toBe(true);
    expect(evaluatePredicate({ field: 'quantity', op: 'lte', value: 5 }, record)).toBe(true);
    expect(evaluatePredicate({ field: 'quantity', op: 'gt', value: 4 }, record)).toBe(true);
    expect(evaluatePredicate({ field: 'quantity', op: 'gte', value: 5 }, record)).toBe(true);
  });

  it('handles missing values without treating them as zero', () => {
    expect(evaluatePredicate({ field: 'quantity', op: 'lt', value: 10 }, {})).toBe(false);
    expect(evaluatePredicate({ field: 'quantity', op: 'exists' }, { quantity: 0 })).toBe(true);
    expect(evaluatePredicate({ field: 'quantity', op: 'blank' }, { quantity: '  ' })).toBe(true);
  });

  it('combines predicates with all and any', () => {
    const record = { status: 'liberada', quantity: 3 };
    const predicate = {
      all: [
        { field: 'status', op: 'eq', value: 'liberada' },
        {
          any: [
            { field: 'quantity', op: 'lt', value: 2 },
            { field: 'quantity', op: 'gte', value: 3 }
          ]
        }
      ]
    };
    expect(evaluatePredicate(predicate, record)).toBe(true);
  });

  it('resolves the today sentinel and field references', () => {
    const context = { today: '2026-06-01' };
    expect(evaluatePredicate({ field: 'endDate', op: 'lt', value: 'today' }, { endDate: '2026-05-31' }, context)).toBe(
      true
    );
    expect(
      evaluatePredicate({ field: 'currentStock', op: 'lt', ref: 'minStock' }, { currentStock: 2, minStock: 5 })
    ).toBe(true);
  });

  it('returns false for unknown operators and malformed predicates', () => {
    expect(evaluatePredicate({ field: 'status', op: 'some', value: 'x' }, { status: 'x' })).toBe(false);
    expect(evaluatePredicate({ op: 'eq', value: 'x' }, {})).toBe(false);
  });
});

describe('evaluateRules', () => {
  it('returns configured violations with the field and message', () => {
    const violations = evaluateRules('document', { status: 'terminada', qualityResult: 'Rechazado' }, config);
    expect(violations).toHaveLength(1);
    expect(violations[0].field).toBe('qualityResult');
    expect(violations[0].message).toContain('Aprobada');
  });

  it('does not apply conditional rules when the condition is false', () => {
    expect(evaluateRules('document', { status: 'liberada' }, config)).toEqual([]);
  });

  it('accepts records that satisfy the rules', () => {
    expect(evaluateRules('document', { status: 'terminada', qualityResult: 'Aprobado' }, config)).toEqual([]);
  });

  it('does not report negative stock when the field is absent', () => {
    expect(evaluateRules('entity', {}, config)).toEqual([]);
    expect(evaluateRules('entity', { currentStock: 0 }, config)).toEqual([]);
  });
});

describe('guardTransition', () => {
  it('accepts only transitions declared in the lifecycle', () => {
    expect(guardTransition('planificada', 'liberada', {}, config).ok).toBe(true);
    expect(guardTransition('planificada', 'terminada', {}, config).ok).toBe(false);
  });

  it('enforces declarative guards', () => {
    const blocked = guardTransition('liberada', 'terminada', { qualityResult: 'Rechazado' }, config);
    expect(blocked.ok).toBe(false);
    expect(blocked.message).toContain('calidad aprobada');

    const allowed = guardTransition('liberada', 'terminada', { qualityResult: 'Aprobado' }, config);
    expect(allowed.ok).toBe(true);
  });

  it('allows free-form transitions when no lifecycle is configured', () => {
    expect(guardTransition('libre', 'otro', {}, { domain: null, statusLifecycle: null }).ok).toBe(true);
  });
});
