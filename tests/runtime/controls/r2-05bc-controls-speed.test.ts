// R2-05BC Controls 测试（速度档）：D01~D04。
import { describe, expect, it } from 'vitest';
import { instantScheduler, makeControls } from './helpers';

function speedBasic(speed: Parameters<ReturnType<typeof makeControls>['ctrl']['run']>[0]) {
  const { ctrl } = makeControls(
    {
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1,
      duration: 100,
    },
    instantScheduler(),
  );
  return { ctrl, out: ctrl.run(speed) };
}

async function runToEnd(speed: 'x1' | 'x10' | 'x100' | 'max') {
  const { ctrl, out } = speedBasic(speed);
  if (!out.ok) throw new Error('expected ok');
  await out.done;
  return ctrl;
}

describe('R2-05BC Controls · 速度档', () => {
  it('D01 四档跑到 completed：final variables/time/tickIndex 完全一致', async () => {
    const results = await Promise.all(['x1', 'x10', 'x100', 'max'].map((s) => runToEnd(s as 'x1' | 'x10' | 'x100' | 'max')));
    for (const ctrl of results) {
      expect(ctrl.status).toBe('completed');
      expect(ctrl.state.variables.a).toBe(100);
      expect(ctrl.state.time).toBe(100);
      expect(ctrl.state.tickIndex).toBe(100);
    }
  });

  it('D02 Speed ≠ dt：任何速度 dt 恒为 timeline.tick', async () => {
    const { ctrl } = makeControls(
      {
        variables: { x: { type: 'number', value: 0 } },
        formulas: [{ id: 'f', target: 'x', expression: 'x + dt' }],
        tick: 0.5,
        duration: 10,
      },
      instantScheduler(),
    );
    const r = ctrl.run('max');
    if (!r.ok) throw new Error('expected ok');
    await r.done;
    // 20 tick × dt(0.5) = 10；若速度误改 dt，x 会偏离 10
    expect(ctrl.state.variables.x).toBeCloseTo(10, 10);
    expect(ctrl.state.tickIndex).toBe(20);
  });

  it('D03 completed 自动停止', async () => {
    const ctrl = await runToEnd('x100');
    expect(ctrl.status).toBe('completed');
    expect(ctrl.run().ok).toBe(false); // completed 不可再 Run（需 Reset）
  });

  it('D04 failed 自动停止 + lastError 保留', async () => {
    const { ctrl } = makeControls(
      {
        variables: { b: { type: 'number', value: 0 } },
        formulas: [{ id: 'fb', target: 'b', expression: '1 / b' }],
      },
      instantScheduler(),
    );
    const r = ctrl.run('max');
    if (!r.ok) throw new Error('expected ok');
    await r.done;
    expect(ctrl.status).toBe('failed');
    expect(ctrl.state.lastError?.code).toBe('FORMULA_EVALUATION_ERROR');
    expect(ctrl.state.lastError?.causeCode).toBe('DIVISION_BY_ZERO');
    expect(ctrl.state.time).toBe(0); // 原子失败零推进
  });
});
