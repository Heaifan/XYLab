// R3 Monitoring 测试（Statistics + 有界历史）：S1~S3、H1~H2。
import { describe, expect, it } from 'vitest';
import { createController } from '../../src/runtime/controller/controller';
import { createMonitorSession, createMonitoredRuntime } from '../../src/monitor/session';
import { makeTickDef } from '../runtime/fixtures';

describe('R3 Monitoring · Statistics', () => {
  it('S1 numeric：initial/current/min/max/average/delta/sampleCount', () => {
    const { controller, session } = createMonitoredRuntime(
      makeTickDef({
        variables: { a: { type: 'number', value: 0 } },
        formulas: [{ id: 'f', target: 'a', expression: 'a + 3' }],
        tick: 1,
        duration: 5,
        watch: [{ target: 'a', mode: 'value' }],
      }),
    );
    for (let i = 0; i < 4; i++) controller.step(); // 3,6,9,12
    const st = session.snapshot().statistics.a;
    if (st.kind !== 'numeric') throw new Error('expected numeric');
    expect(st.initial).toBe(0);
    expect(st.current).toBe(12);
    expect(st.min).toBe(0);
    expect(st.max).toBe(12);
    expect(st.delta).toBe(12);
    expect(st.average).toBe(6);
    expect(st.sampleCount).toBe(5);
  });

  it('S2 boolean：initial/current/changeCount（不算 average）', () => {
    const { controller, session } = createMonitoredRuntime(
      makeTickDef({
        variables: { fatigue: { type: 'number', value: 0 }, flag: { type: 'boolean', value: false } },
        formulas: [
          { id: 'f1', target: 'fatigue', expression: 'fatigue + 3' },
          { id: 'f2', target: 'flag', expression: 'fatigue >= 5' },
        ],
        tick: 1,
        duration: 5,
        watch: [{ target: 'flag', mode: 'value' }],
      }),
    );
    for (let i = 0; i < 4; i++) controller.step(); // 3→false, 6→true, 9, 12
    const st = session.snapshot().statistics.flag;
    if (st.kind !== 'boolean') throw new Error('expected boolean');
    expect(st.initial).toBe(false);
    expect(st.current).toBe(true);
    expect(st.changeCount).toBe(1);
  });

  it('S3 非数值/布尔 watch（string）只有 series，无 statistics', () => {
    const { session } = createMonitoredRuntime(
      makeTickDef({ variables: { s: { type: 'string', value: 'x' } }, watch: [{ target: 's', mode: 'value' }] }),
    );
    const snap = session.snapshot();
    expect(snap.series.s).toHaveLength(1);
    expect(snap.statistics.s).toBeUndefined();
  });
});

describe('R3 Monitoring · Bounded History', () => {
  it('H1 超过 seriesCap 保留最新数据（cap=5 验证）', async () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1,
      duration: 20,
      watch: [{ target: 'a', mode: 'value' }],
    });
    const session = createMonitorSession(def, { seriesCap: 5 });
    const controller = createController(def, { observer: (o) => session.observe(o) });
    const r = controller.run('max');
    if (!r.ok) throw new Error('expected ok');
    await r.done;
    const series = session.snapshot().series.a;
    expect(series).toHaveLength(5);
    expect(series[0].tickIndex).toBe(16);
    expect(series[4].tickIndex).toBe(20); expect(series[4].value).toBe(20);
  });

  it('H2 Reset 清除历史并重建初始点', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 7 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1,
      duration: 10,
      watch: [{ target: 'a', mode: 'value' }],
    });
    const { controller, session, reset } = createMonitoredRuntime(def);
    controller.step();
    controller.step();
    expect(session.snapshot().series.a).toHaveLength(3);
    reset();
    const snap = session.snapshot();
    expect(snap.series.a).toHaveLength(1); expect(snap.series.a[0]).toEqual({ time: 0, tickIndex: 0, value: 7 });
    expect(snap.logs).toHaveLength(0);
    expect(snap.session.tickCount).toBe(0);
    expect(snap.statistics.a.kind).toBe('numeric');
  });
});
