// R3 Monitoring 测试（确定性硬边界）：D1~D2。
// 铁律：Monitoring on/off 不得改变模拟结果；同 JSON+seed 四档速度监控结果完全一致。
import { describe, expect, it } from 'vitest';
import { createController } from '../../src/runtime/controller/controller';
import { createMonitoredRuntime } from '../../src/monitor/session';
import { instantScheduler } from '../runtime/controls/helpers';
import { makeTickDef } from '../runtime/fixtures';
import type { RunSpeed } from '../../src/runtime/controller/types';

function randDef() {
  return makeTickDef({
    variables: { a: { type: 'number', value: 0 } },
    formulas: [{ id: 'f', target: 'a', expression: 'a + random() * 10' }],
    tick: 0.5,
    duration: 20,
    random: { seed: 42 },
    watch: [{ target: 'a', mode: 'value' }],
    events: [{ id: 'mid', when: 'a >= 30', message: '过半', level: 'warning' }],
  });
}

async function monitoredRun(seedDef: ReturnType<typeof randDef>, speed: RunSpeed) {
  const { controller, session } = createMonitoredRuntime(seedDef, instantScheduler());
  const r = controller.run(speed);
  if (!r.ok) throw new Error('expected ok');
  await r.done;
  const s = session.snapshot();
  return JSON.stringify({ series: s.series, logs: s.logs, statistics: s.statistics, session: s.session });
}

describe('R3 Monitoring · 确定性硬边界', () => {
  it('D1 Monitoring on/off：模拟最终结果完全一致', async () => {
    const def = randDef();
    const { controller: monitored } = createMonitoredRuntime(def, instantScheduler());
    const r1 = monitored.run('max');
    if (!r1.ok) throw new Error('expected ok');
    await r1.done;

    const plain = createController(def, { scheduler: instantScheduler() });
    const r2 = plain.run('max');
    if (!r2.ok) throw new Error('expected ok');
    await r2.done;

    const pick = (c: { state: { variables: unknown; time: unknown; tickIndex: unknown; rng: unknown; status: unknown } }) =>
      JSON.stringify({ v: c.state.variables, time: c.state.time, tick: c.state.tickIndex, rng: c.state.rng, status: c.state.status });
    expect(pick(monitored)).toBe(pick(plain));
  });

  it('D2 四档速度：监控 Series/Logs/Statistics 完全一致', async () => {
    const x1 = await monitoredRun(randDef(), 'x1');
    const x10 = await monitoredRun(randDef(), 'x10');
    const x100 = await monitoredRun(randDef(), 'x100');
    const max = await monitoredRun(randDef(), 'max');
    expect(x1).toBe(x10);
    expect(x1).toBe(x100);
    expect(x1).toBe(max);
  });
});
