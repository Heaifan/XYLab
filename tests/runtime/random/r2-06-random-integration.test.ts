// R2-06 Random 测试（Tick 集成）：I01~I03。
import { describe, expect, it } from 'vitest';
import { createController } from '../../../src/runtime/controller/controller';
import { instantScheduler } from '../controls/helpers';
import { makeTickDef } from '../fixtures';

function randomDef(seed = 12345) {
  return makeTickDef({
    variables: { a: { type: 'number', value: 0 } },
    formulas: [{ id: 'f', target: 'a', expression: 'a + random() * 10' }],
    tick: 1,
    duration: 20,
    random: { seed },
  });
}

async function runOnce(seed: number): Promise<string> {
  const ctrl = createController(randomDef(seed), { scheduler: instantScheduler() });
  const r = ctrl.run('max');
  if (!r.ok) throw new Error('expected ok');
  await r.done;
  return JSON.stringify({ a: ctrl.state.variables.a, rng: ctrl.state.rng, time: ctrl.state.time, tickIndex: ctrl.state.tickIndex });
}

describe('R2-06 Random · Tick 集成', () => {
  it('I01 同 seed 两次独立运行最终结果完全一致', async () => {
    expect(await runOnce(12345)).toBe(await runOnce(12345));
  });

  it('I02 不同 seed 结果不同（受控随机确实生效）', async () => {
    const ctrl1 = createController(randomDef(12345), { scheduler: instantScheduler() });
    const r1 = ctrl1.run('max');
    if (!r1.ok) throw new Error('expected ok');
    await r1.done;
    const ctrl2 = createController(randomDef(99999), { scheduler: instantScheduler() });
    const r2 = ctrl2.run('max');
    if (!r2.ok) throw new Error('expected ok');
    await r2.done;
    expect(ctrl1.state.variables.a).not.toBe(ctrl2.state.variables.a);
  });

  it('I03 Reset 后重跑：随机序列与最终结果完全一致（PRNG 回到 seed 初始态）', async () => {
    const ctrl = createController(randomDef(12345), { scheduler: instantScheduler() });
    const r1 = ctrl.run('max');
    if (!r1.ok) throw new Error('expected ok');
    await r1.done;
    const first = JSON.stringify({ a: ctrl.state.variables.a, rng: ctrl.state.rng });
    ctrl.reset();
    expect(ctrl.state.rng.state).toBe(12345 >>> 0); // Reset = PRNG 回 seed 初始态
    const r2 = ctrl.run('max');
    if (!r2.ok) throw new Error('expected ok');
    await r2.done;
    expect(JSON.stringify({ a: ctrl.state.variables.a, rng: ctrl.state.rng })).toBe(first);
  });
});
