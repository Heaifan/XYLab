// R2-01 测试（类型类语义错误码）：T09~T12 + 聚合用例。
import { describe, expect, it } from 'vitest';
import { loadExperiment } from '../../src/protocol/loader';
import { base } from './fixtures';

describe('R2-01 Loader · 类型语义', () => {
  it('T09 duration/tick 非整数 tick 数 → INVALID_TIMELINE_RANGE', () => {
    const bad = base();
    bad.timeline = { mode: 'fixed_tick', tick: 2, duration: 5 };
    const r = loadExperiment(bad);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors.map((e) => e.code)).toContain('INVALID_TIMELINE_RANGE');
  });

  it('T10 保留字变量名 → RESERVED_NAME', () => {
    const bad = base();
    bad.variables = { time: { type: 'number', value: 0 } };
    const r = loadExperiment(bad);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors.map((e) => e.code)).toContain('RESERVED_NAME');
  });

  it('T11 number 变量 value 是字符串 → VARIABLE_TYPE_INVALID', () => {
    const bad = base();
    bad.variables = { a: { type: 'number', value: 'x' } };
    const r = loadExperiment(bad);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors.map((e) => e.code)).toContain('VARIABLE_TYPE_INVALID');
  });

  it('T12 enum value 不在 options → VARIABLE_TYPE_INVALID', () => {
    const bad = base();
    bad.variables = { s: { type: 'enum', value: 'fly', options: ['hold', 'move'] } };
    const r = loadExperiment(bad);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors.map((e) => e.code)).toContain('VARIABLE_TYPE_INVALID');
  });

  it('补充：一次收集多个语义错误（聚合而非 fail-fast）', () => {
    const bad = base();
    bad.variables = {
      time: { type: 'number', value: 0 },
      s: { type: 'enum', value: 'fly', options: ['hold'] },
    };
    bad.formulas = [{ id: 'f1', target: 'missing', expression: '1' }];
    const r = loadExperiment(bad);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    const codes = r.errors.map((e) => e.code);
    expect(codes).toContain('RESERVED_NAME');
    expect(codes).toContain('VARIABLE_TYPE_INVALID');
    expect(codes).toContain('FORMULA_TARGET_NOT_FOUND');
  });
});
