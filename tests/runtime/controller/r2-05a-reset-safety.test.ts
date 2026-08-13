// R2-05A Controller 测试（失败与 Reset）：A08~A13。
import { describe, expect, it } from 'vitest';
import { makeController } from '../fixtures';

describe('R2-05A Controller · 失败与 Reset', () => {
  it('A08 Tick 失败 → failed', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 10 }, b: { type: 'number', value: 0 } },
      formulas: [
        { id: 'fa', target: 'a', expression: '100' },
        { id: 'fb', target: 'b', expression: '10 / b' },
      ],
    });
    const out = controller.step();
    expect(out.ok).toBe(false);
    expect(controller.status).toBe('failed');
  });

  it('A09 failed 保留 Tick 失败前的原 State（变量/时间/tickIndex）', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 10 }, b: { type: 'number', value: 0 } },
      formulas: [
        { id: 'fa', target: 'a', expression: '100' },
        { id: 'fb', target: 'b', expression: '10 / b' },
      ],
    });
    const beforeVars = JSON.stringify(controller.state.variables);
    controller.step();
    expect(JSON.stringify(controller.state.variables)).toBe(beforeVars); // a 未被写成 100
    expect(controller.state.time).toBe(0);
    expect(controller.state.tickIndex).toBe(0);
    expect(controller.state.status).toBe('failed'); // 状态转换与 lastError 是故意的
    expect(controller.state.lastError).not.toBeNull();
  });

  it('A10 lastError 正确保存（code + causeCode + formulaId）', () => {
    const { controller } = makeController({
      variables: { b: { type: 'number', value: 0 } },
      formulas: [{ id: 'fb', target: 'b', expression: '1 / b' }],
    });
    controller.step();
    expect(controller.state.lastError?.code).toBe('FORMULA_EVALUATION_ERROR');
    expect(controller.state.lastError?.causeCode).toBe('DIVISION_BY_ZERO');
    expect(controller.state.lastError?.formulaId).toBe('fb');
  });

  it('A11 Reset 恢复初始 State（变量/时间/tickIndex，且是新对象）', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1,
      duration: 10,
    });
    const original = controller.state;
    controller.step();
    controller.step();
    expect(controller.state.variables.a).toBe(2);
    controller.reset();
    expect(controller.state).not.toBe(original); // 全新对象
    expect(controller.state.variables.a).toBe(0);
    expect(controller.state.time).toBe(0);
    expect(controller.state.tickIndex).toBe(0);
  });

  it('A12 Reset 清 lastError', () => {
    const { controller } = makeController({
      variables: { b: { type: 'number', value: 0 } },
      formulas: [{ id: 'fb', target: 'b', expression: '1 / b' }],
    });
    controller.step();
    expect(controller.state.lastError).not.toBeNull();
    controller.reset();
    expect(controller.state.lastError).toBeNull();
  });

  it('A13 Reset → ready', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
    });
    controller.step();
    controller.reset();
    expect(controller.status).toBe('ready');
  });
});
