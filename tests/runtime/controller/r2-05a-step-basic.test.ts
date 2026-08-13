// R2-05A Controller 测试（Step 基础路径）：A01~A05。
import { describe, expect, it } from 'vitest';
import { makeController } from '../fixtures';

describe('R2-05A Controller · Step 基础', () => {
  it('A01 初始 ready，time=0，tickIndex=0', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
    });
    expect(controller.status).toBe('ready');
    expect(controller.state.time).toBe(0);
    expect(controller.state.tickIndex).toBe(0);
    expect(controller.state.lastError).toBeNull();
  });

  it('A02 ready Step → paused', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
    });
    const out = controller.step();
    expect(out.ok).toBe(true);
    expect(controller.status).toBe('paused');
    expect(controller.state.status).toBe('paused'); // state == 唯一真相
  });

  it('A03 paused Step → paused（未到终点前持续可单步）', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1,
      duration: 10,
    });
    expect(controller.step().ok).toBe(true);
    expect(controller.status).toBe('paused');
    expect(controller.step().ok).toBe(true);
    expect(controller.status).toBe('paused');
  });

  it('A04 Step 只执行 1 Tick', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
    });
    controller.step();
    expect(controller.state.variables.a).toBe(1); // 不是 2
    expect(controller.state.time).toBe(1);
    expect(controller.state.tickIndex).toBe(1);
  });

  it('A05 连续 Step 后 time/tickIndex 正确', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 2,
      duration: 10,
    });
    controller.step();
    controller.step();
    controller.step();
    expect(controller.state.time).toBe(6);
    expect(controller.state.tickIndex).toBe(3);
    expect(controller.state.variables.a).toBe(3);
  });
});
