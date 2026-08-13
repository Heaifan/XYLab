// R2-06 Random 测试（速度档联合确定性）：D01~D02。
// 铁律：随机序列按调用序列推进，与调度速度无关——x1/x10/x100/max 必须得到完全一致的随机结果。
import { describe, expect, it } from 'vitest';
import { createController } from '../../../src/runtime/controller/controller';
import { instantScheduler } from '../controls/helpers';
import { makeTickDef } from '../fixtures';

async function runSpeed(seed: number, speed: 'x1' | 'x10' | 'x100' | 'max') {
  const def = makeTickDef({
    variables: { a: { type: 'number', value: 0 }, b: { type: 'number', value: 0 } },
    formulas: [
      { id: 'fa', target: 'a', expression: 'a + random() * 10' },
      { id: 'fb', target: 'b', expression: 'b + random()' },
    ],
    tick: 0.5,
    duration: 50,
    random: { seed },
  });
  const ctrl = createController(def, { scheduler: instantScheduler() });
  const r = ctrl.run(speed);
  if (!r.ok) throw new Error('expected ok');
  await r.done;
  return JSON.stringify({
    a: ctrl.state.variables.a,
    b: ctrl.state.variables.b,
    time: ctrl.state.time,
    tickIndex: ctrl.state.tickIndex,
    rng: ctrl.state.rng,
    status: ctrl.status,
  });
}

describe('R2-06 Random · 速度档联合确定性', () => {
  it('D01 同一 seed 四档速度：随机序列与最终结果完全一致', async () => {
    const [x1, x10, x100, max] = await Promise.all([
      runSpeed(12345, 'x1'),
      runSpeed(12345, 'x10'),
      runSpeed(12345, 'x100'),
      runSpeed(12345, 'max'),
    ]);
    expect(x1).toBe(x10);
    expect(x1).toBe(x100);
    expect(x1).toBe(max);
  });

  it('D02 Reset 重跑（max）与首次 x1 结果一致', async () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + random() * 10' }],
      tick: 1,
      duration: 30,
      random: { seed: 777 },
    });
    const ctrl = createController(def, { scheduler: instantScheduler() });
    const r1 = ctrl.run('x1');
    if (!r1.ok) throw new Error('expected ok');
    await r1.done;
    const first = JSON.stringify({ a: ctrl.state.variables.a, rng: ctrl.state.rng });
    ctrl.reset();
    const r2 = ctrl.run('max');
    if (!r2.ok) throw new Error('expected ok');
    await r2.done;
    expect(JSON.stringify({ a: ctrl.state.variables.a, rng: ctrl.state.rng })).toBe(first);
  });
});
