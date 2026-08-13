// R2-02 测试（隔离与 Reset）：T07~T10。夹具来自 r2-02-runtime-state.test.ts。
import { describe, expect, it } from 'vitest';
import { createRuntimeState } from '../../src/runtime/create-runtime-state';
import { resetRuntimeState } from '../../src/runtime/state';
import { defOf, defWithEntities } from './fixtures';

describe('R2-02 Runtime State · 隔离与 Reset', () => {
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
