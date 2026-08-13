// R2-01 测试套件：T01~T08 为轮次冻结最小集，T09~T12 为语义错误码补充覆盖。
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadExperiment } from '../src/protocol/loader';
import type { RawExperiment } from '../src/protocol/types';

const exampleJson = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../examples/fatigue-basic.json'),
  'utf-8',
);

function base(): RawExperiment {
  return {
    schema: 'xylab-experiment@0.1',
    experiment: { id: 't-basic', name: 'T 实验' },
    variables: { a: { type: 'number', value: 1 } },
    formulas: [{ id: 'f1', target: 'a', expression: 'a + 1' }],
    timeline: { mode: 'fixed_tick', tick: 1, duration: 10 },
  };
}

describe('R2-01 Experiment Loader', () => {
  it('T01 合法 fatigue-basic → LOAD_SUCCESS', () => {
    const r = loadExperiment(exampleJson);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('预期加载成功');
    expect(r.definition.schemaVersion).toBe('xylab-experiment@0.1');
    expect(r.definition.experiment.id).toBe('fatigue-basic-001');
    expect(r.definition.timeline.totalTicks).toBe(600);
    expect(r.definition.variables.fatigue.label).toBe('疲劳度');
    expect(r.definition.variables.move_speed.unit).toBe('m/s');
    expect(r.definition.events[0]?.level).toBe('warning');
    expect(r.definition.output?.charts[0]).toEqual({ x: 'time', y: 'fatigue' });
  });

  it('T02 非法 JSON 字符串 → INVALID_JSON', () => {
    const r = loadExperiment('{not json');
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors[0]?.code).toBe('INVALID_JSON');
  });

  it('T03 Schema 非法 → SCHEMA_VALIDATION_FAILED（保留 path/keyword/message）', () => {
    const bad: RawExperiment = {
      schema: 'xylab-experiment@0.1',
      timeline: { mode: 'fixed_tick', tick: 1, duration: 10 },
      // 缺 experiment
    };
    const r = loadExperiment(bad);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors[0]?.code).toBe('SCHEMA_VALIDATION_FAILED');
    expect(r.errors[0]?.keyword).toBeTruthy();
    expect(r.errors[0]?.path).toBeTruthy();
    expect(r.errors[0]?.message).toBeTruthy();
  });

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
    src.variables = { speed: { type: 'number', value: 3 } }; // 无 label
    src.formulas = [{ id: 'f1', target: 'speed', expression: 'speed + 1' }];
    src.watch = [{ target: 'speed', mode: 'threshold', threshold: 5 }]; // 无 operator
    src.events = [{ id: 'e1', when: 'speed >= 2' }]; // 无 message/level/repeat
    const r = loadExperiment(src);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error(`预期成功，实际失败：${r.errors[0]?.message}`);
    expect(r.definition.variables.speed.label).toBe('speed'); // label = 变量名
    expect(r.definition.watch[0]?.operator).toBe('>='); // threshold 默认 >=
    expect(r.definition.events[0]?.message).toBe('e1'); // message = id
    expect(r.definition.events[0]?.level).toBe('info'); // level = info
    expect(r.definition.events[0]?.repeat).toBe(false); // repeat = false
  });

  it('T08 原始输入对象不得被 Loader 修改', () => {
    const src = base();
    src.variables = { speed: { type: 'number', value: 3, min: 0 } };
    src.formulas = [{ id: 'f1', target: 'speed', expression: 'speed + 1' }];
    const before = JSON.stringify(src);
    const r = loadExperiment(src); // 对象输入路径
    expect(r.ok).toBe(true);
    expect(JSON.stringify(src)).toBe(before);
  });

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
    bad.variables = { time: { type: 'number', value: 0 }, s: { type: 'enum', value: 'fly', options: ['hold'] } };
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
