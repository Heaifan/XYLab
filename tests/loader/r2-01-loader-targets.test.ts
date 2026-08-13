// R2-01 测试（目标引用）：T04~T08。共享夹具 base() 来自 r2-01-loader-load.test.ts。
import { describe, expect, it } from 'vitest';
import { loadExperiment } from '../../src/protocol/loader';
import { base } from './fixtures';

describe('R2-01 Loader · 目标引用', () => {
  it('T04 Formula target 不存在 → FORMULA_TARGET_NOT_FOUND', () => {
    const bad = base();
    bad.formulas = [{ id: 'f1', target: 'missing', expression: '1' }];
    const r = loadExperiment(bad);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors.map((e) => e.code)).toContain('FORMULA_TARGET_NOT_FOUND');
  });

  it('T05 Watch target 不存在 → WATCH_TARGET_NOT_FOUND', () => {
    const bad = base();
    bad.watch = [{ target: 'nope', mode: 'value' }];
    const r = loadExperiment(bad);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors.map((e) => e.code)).toContain('WATCH_TARGET_NOT_FOUND');
  });

  it('T06 重复 Entity ID → DUPLICATE_ENTITY_ID', () => {
    const bad = base();
    bad.entities = [
      { id: 'u1', state: { hp: 1 } },
      { id: 'u1', state: { hp: 2 } },
    ];
    const r = loadExperiment(bad);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors.map((e) => e.code)).toContain('DUPLICATE_ENTITY_ID');
  });

  it('T07 合法默认字段 → Normalize 后值正确', () => {
    const src = base();
    src.variables = { speed: { type: 'number', value: 3 } };
    src.formulas = [{ id: 'f1', target: 'speed', expression: 'speed + 1' }];
    src.watch = [{ target: 'speed', mode: 'threshold', threshold: 5 }];
    src.events = [{ id: 'e1', when: 'speed >= 2' }];
    const r = loadExperiment(src);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error(`预期成功，实际失败：${r.errors[0]?.message}`);
    expect(r.definition.variables.speed.label).toBe('speed');
    expect(r.definition.watch[0]?.operator).toBe('>=');
    expect(r.definition.events[0]?.message).toBe('e1');
    expect(r.definition.events[0]?.level).toBe('info');
    expect(r.definition.events[0]?.repeat).toBe(false);
  });

  it('T08 原始输入对象不得被 Loader 修改', () => {
    const src = base();
    src.variables = { speed: { type: 'number', value: 3, min: 0 } };
    src.formulas = [{ id: 'f1', target: 'speed', expression: 'speed + 1' }];
    const before = JSON.stringify(src);
    const r = loadExperiment(src);
    expect(r.ok).toBe(true);
    expect(JSON.stringify(src)).toBe(before);
  });
});
