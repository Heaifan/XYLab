// R2-02 测试（初始化）：T01~T06。隔离/Reset 用例见 r2-02-runtime-isolation.test.ts。
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRuntimeState } from '../../src/runtime/create-runtime-state';
import { defOf, defWithEntities } from './fixtures';

const exampleJson = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../examples/fatigue-basic.json'),
  'utf-8',
);

describe('R2-02 Runtime State · 初始化', () => {
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
});
