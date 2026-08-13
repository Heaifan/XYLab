// R4-F1 参数草稿测试：类型守卫 / 不可变 / 正式重建边界集成。
import { describe, expect, it } from 'vitest';
import { hasDraftChanges, isValidValue, withInitialValues } from '../../src/ui/experiment/draft';
import { createController } from '../../src/runtime/controller/controller';
import { makeTickDef } from '../runtime/fixtures';

function draftDef() {
  return makeTickDef({
    variables: {
      a: { type: 'number', value: 5 },
      b: { type: 'integer', value: 3 },
      c: { type: 'boolean', value: false },
    },
    formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
    tick: 1,
    duration: 10,
  });
}

describe('R4-F1 · 参数草稿与重建边界', () => {
  it('isValidValue 类型守卫：number/integer/boolean/enum/string', () => {
    expect(isValidValue('number', 1.5)).toBe(true);
    expect(isValidValue('number', Number.NaN)).toBe(false);
    expect(isValidValue('integer', 3)).toBe(true);
    expect(isValidValue('integer', 3.7)).toBe(false);
    expect(isValidValue('boolean', true)).toBe(true);
    expect(isValidValue('boolean', 1)).toBe(false);
    expect(isValidValue('enum', 'fast')).toBe(true);
    expect(isValidValue('string', 'x')).toBe(true);
  });

  it('withInitialValues：合法覆盖生效，非法覆盖忽略（绝不静默注入）', () => {
    const def = draftDef();
    const next = withInitialValues(def, { a: 9, b: 3.7, c: true, ghost: 1 });
    expect(next.variables.a.value).toBe(9);
    expect(next.variables.b.value).toBe(3); // integer 3.7 被守卫拒绝
    expect(next.variables.c.value).toBe(true);
    expect('ghost' in next.variables).toBe(false);
  });

  it('withInitialValues 不修改原始 Definition（RS-01）', () => {
    const def = draftDef();
    withInitialValues(def, { a: 9 });
    expect(def.variables.a.value).toBe(5);
  });

  it('hasDraftChanges：有真实变更才为 true', () => {
    const def = draftDef();
    expect(hasDraftChanges(def, { a: 9 })).toBe(true);
    expect(hasDraftChanges(def, { a: 5 })).toBe(false);
    expect(hasDraftChanges(def, {})).toBe(false);
  });

  it('重建边界：应用草稿 → 新 Controller ready，旧 Controller 状态不受影响', () => {
    const def = draftDef();
    const oldCtrl = createController(def);
    const next = withInitialValues(def, { a: 9 });
    const newCtrl = createController(next);
    expect(newCtrl.status).toBe('ready');
    expect(newCtrl.state.variables.a).toBe(9);
    expect(oldCtrl.state.variables.a).toBe(5); // 旧 Runtime 零影响
    expect(newCtrl.state.time).toBe(0);
    expect(newCtrl.state.tickIndex).toBe(0);
  });
});
