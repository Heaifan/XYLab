// R2-05A Controller 测试（转换守卫）：A14~A17。
import { describe, expect, it } from 'vitest';
import { canStep } from '../../../src/runtime/controller/transitions';
import { makeController } from '../fixtures';

describe('R2-05A Controller · 转换守卫', () => {
  it('A14 completed 禁止 Step', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1,
      duration: 1,
    });
    expect(controller.step().ok).toBe(true);
    expect(controller.status).toBe('completed');
    const out = controller.step();
    expect(out.ok).toBe(false);
    if (out.ok) throw new Error('expected failure');
    expect(out.code).toBe('INVALID_RUNTIME_TRANSITION');
    expect(controller.status).toBe('completed'); // 状态未被破坏
  });

  it('A15 守卫表：running/stopped/completed/failed 不可 Step，ready/paused 可', () => {
    expect(canStep('ready')).toBe(true);
    expect(canStep('paused')).toBe(true);
    expect(canStep('running')).toBe(false); // 05B 调度接管前，合同已占位
    expect(canStep('completed')).toBe(false);
    expect(canStep('stopped')).toBe(false);
    expect(canStep('failed')).toBe(false);
  });

  it('A16 failed 禁止 Step，lastError 不被二次覆盖', () => {
    const { controller } = makeController({
      variables: { b: { type: 'number', value: 0 } },
      formulas: [{ id: 'fb', target: 'b', expression: '1 / b' }],
    });
    controller.step();
    const first = controller.state.lastError;
    const out = controller.step();
    expect(out.ok).toBe(false);
    if (out.ok) throw new Error('expected failure');
    expect(out.code).toBe('INVALID_RUNTIME_TRANSITION');
    expect(controller.state.lastError).toBe(first); // 未被覆盖
  });

  it('A17 非法转换明确失败：code=INVALID_RUNTIME_TRANSITION 且 message 非空', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1,
      duration: 1,
    });
    controller.step(); // → completed
    const out = controller.step();
    expect(out.ok).toBe(false);
    if (out.ok) throw new Error('expected failure');
    expect(out.code).toBe('INVALID_RUNTIME_TRANSITION');
    if (out.code !== 'INVALID_RUNTIME_TRANSITION') throw new Error('expected INVALID_RUNTIME_TRANSITION');
    expect(out.message.length).toBeGreaterThan(0);
  });
});
