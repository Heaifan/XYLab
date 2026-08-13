// R2-02 测试套件：T01~T10（轮次冻结最小集）。
// 验证：初始化映射、Definition 不被污染（深隔离）、双 Runtime 互不污染、Reset 可复现、五类变量、ID 索引转换。
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadExperiment } from '../src/protocol/loader';
import { createRuntimeState } from '../src/runtime/create-runtime-state';
import { resetRuntimeState } from '../src/runtime/state';
import type { ExperimentDefinition } from '../src/protocol/types';
import type { RawExperiment } from '../src/protocol/types';

const exampleJson = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../examples/fatigue-basic.json'),
  'utf-8',
);

// 通过真实 Loader 构造可信 Definition（端到端，复用 R2-01 门禁）
function defOf(raw: RawExperiment | string): ExperimentDefinition {
  const r = loadExperiment(raw);
  if (!r.ok) throw new Error(`加载失败：${r.errors.map((e) => e.message).join('; ')}`);
  return r.definition;
}

function defWithEntities(): ExperimentDefinition {
  return defOf({
    schema: 'xylab-experiment@0.1',
    experiment: { id: 't-entity', name: '实体实验' },
    variables: { fatigue: { type: 'number', value: 0 } },
    entities: [
      { id: 'unit-a', name: '步兵A', type: 'infantry', state: { hp: 100, fatigue: 0 } },
      { id: 'unit-b', state: { hp: 80, morale: 60 } },
      { id: 'unit-c', state: { hp: 999 } },
    ],
    timeline: { mode: 'fixed_tick', tick: 1, duration: 10 },
  });
}

describe('R2-02 Runtime State', () => {
  it('T01 合法 Definition 初始化 Runtime（status=ready）', () => {
    const s = createRuntimeState(defOf(exampleJson));
    expect(s.status).toBe('ready');
    expect(s.metadata.experimentId).toBe('fatigue-basic-001');
    expect(s.metadata.schemaVersion).toBe('xylab-experiment@0.1');
  });

  it('T02 变量初始值正确映射（只存值，不复制 UI 定义）', () => {
    const s = createRuntimeState(defOf(exampleJson));
    expect(s.variables).toEqual({ fatigue: 0, move_speed: 5, fatigue_rate: 0.05 });
  });

  it('T03 Runtime 修改变量不污染 Definition', () => {
    const def = defOf(exampleJson);
    const s = createRuntimeState(def);
    s.variables.fatigue = 50;
    expect(def.variables.fatigue.value).toBe(0);
  });

  it('T04 Entity State 初始化正确', () => {
    const s = createRuntimeState(defWithEntities());
    expect(s.entities['unit-a']?.state).toEqual({ hp: 100, fatigue: 0 });
  });

  it('T05 Runtime 修改 Entity 不污染 Definition（深拷贝）', () => {
    const def = defWithEntities();
    const s = createRuntimeState(def);
    s.entities['unit-a'].state.hp = 50;
    s.entities['unit-a'].state.fatigue = 99;
    expect(def.entities[0]?.state.hp).toBe(100);
    expect(def.entities[0]?.state.fatigue).toBe(0);
  });

  it('T06 初始 time=0 / tickIndex=0（冻结：首 Tick 后才变化）', () => {
    const s = createRuntimeState(defOf(exampleJson));
    expect(s.time).toBe(0);
    expect(s.tickIndex).toBe(0);
  });

  it('T07 重复创建两个 Runtime 相互隔离', () => {
    const def = defWithEntities();
    const a = createRuntimeState(def);
    const b = createRuntimeState(def);
    a.variables.fatigue = 1;
    a.entities['unit-a'].state.hp = 1;
    expect(b.variables.fatigue).toBe(0);
    expect(b.entities['unit-a']?.state.hp).toBe(100);
  });

  it('T08 Reset 后恢复完全一致的初始状态（RS-03 可复现）', () => {
    const def = defWithEntities();
    const initial = createRuntimeState(def);
    const s = createRuntimeState(def);
    // 模拟运行后的脏状态（本轮不进入 Tick，仅手动改动）
    s.time = 42;
    s.tickIndex = 42;
    s.variables.fatigue = 87;
    s.entities['unit-a'].state.hp = 5;
    const after = resetRuntimeState(def);
    expect(after).toEqual(initial); // 深度一致
    expect(after).not.toBe(initial); // 且是新对象
  });

  it('T09 五类变量初值正确保留（number/integer/boolean/enum/string）', () => {
    const def = defOf({
      schema: 'xylab-experiment@0.1',
      experiment: { id: 't-types', name: '类型实验' },
      variables: {
        n: { type: 'number', value: 1.5 },
        i: { type: 'integer', value: 3 },
        b: { type: 'boolean', value: true },
        e: { type: 'enum', value: 'hold', options: ['hold', 'move'] },
        s: { type: 'string', value: 'hello' },
      },
      timeline: { mode: 'fixed_tick', tick: 1, duration: 10 },
    });
    const st = createRuntimeState(def);
    expect(st.variables).toEqual({ n: 1.5, i: 3, b: true, e: 'hold', s: 'hello' });
  });

  it('T10 array→record 索引转换无遗漏无覆盖', () => {
    const s = createRuntimeState(defWithEntities());
    expect(Object.keys(s.entities).sort()).toEqual(['unit-a', 'unit-b', 'unit-c']);
    expect(s.entities['unit-b']?.state).toEqual({ hp: 80, morale: 60 });
    expect(s.entities['unit-c']?.state).toEqual({ hp: 999 });
  });
});
