// STAT-1 · 数值统计：初始化点不计样本；Welford 样本标准差；布尔/有界历史保持原语义。
import { describe, expect, it } from 'vitest';
import { NumericAccumulator } from '../../src/monitor/accumulators';
import { createController } from '../../src/runtime/controller/controller';
import { createMonitorSession, createMonitoredRuntime } from '../../src/monitor/session';
import { makeTickDef } from '../runtime/fixtures';

describe('STAT-1 · Numeric Statistics', () => {
  it('S1 4 个成功 Tick → n=4，初始化 0 不进入 mean/min/max/σ', () => {
    const { controller, session } = createMonitoredRuntime(makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 3' }],
      tick: 1, duration: 5, watch: [{ target: 'a', mode: 'value' }],
    }));
    for (let i = 0; i < 4; i++) controller.step();
    const st = session.snapshot().statistics.a;
    if (st.kind !== 'numeric') throw new Error('expected numeric');
    expect(st.initial).toBe(0); expect(st.current).toBe(12); expect(st.delta).toBe(12);
    expect(st.min).toBe(3); expect(st.max).toBe(12); expect(st.average).toBe(7.5);
    expect(st.sampleCount).toBe(4); expect(st.sampleStdDev).toBeCloseTo(Math.sqrt(15));
  });

  it('S2 标准向量 1..5 → sample σ = sqrt(2.5)', () => {
    const acc = new NumericAccumulator(99);
    for (const v of [1, 2, 3, 4, 5]) acc.record(v);
    const st = acc.snapshot();
    expect(st.sampleCount).toBe(5); expect(st.average).toBe(3);
    expect(st.min).toBe(1); expect(st.max).toBe(5);
    expect(st.sampleStdDev).toBeCloseTo(Math.sqrt(2.5), 10);
  });

  it('S3 未运行与单样本不伪造 σ', () => {
    const acc = new NumericAccumulator(7);
    expect(acc.snapshot()).toMatchObject({ initial: 7, current: 7, average: 7, sampleCount: 0, sampleStdDev: null });
    acc.record(9);
    expect(acc.snapshot()).toMatchObject({ current: 9, average: 9, sampleCount: 1, sampleStdDev: null });
  });

  it('S4 boolean 仍从初始化状态计算 changeCount', () => {
    const { controller, session } = createMonitoredRuntime(makeTickDef({
      variables: { fatigue: { type: 'number', value: 0 }, flag: { type: 'boolean', value: false } },
      formulas: [{ id: 'f1', target: 'fatigue', expression: 'fatigue + 3' }, { id: 'f2', target: 'flag', expression: 'fatigue >= 5' }],
      tick: 1, duration: 5, watch: [{ target: 'flag', mode: 'value' }],
    }));
    for (let i = 0; i < 4; i++) controller.step();
    const st = session.snapshot().statistics.flag;
    if (st.kind !== 'boolean') throw new Error('expected boolean');
    expect(st.initial).toBe(false); expect(st.current).toBe(true); expect(st.changeCount).toBe(1);
  });

  it('S5 string 只有 series，无 statistics', () => {
    const { session } = createMonitoredRuntime(makeTickDef({ variables: { s: { type: 'string', value: 'x' } }, watch: [{ target: 's', mode: 'value' }] }));
    const snap = session.snapshot();
    expect(snap.series.s).toHaveLength(1); expect(snap.statistics.s).toBeUndefined();
  });
});

describe('STAT-1 · Bounded History / Reset', () => {
  it('H1 seriesCap=5 保留最新 Tick，但统计仍覆盖全部 Tick', async () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 } }, formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1, duration: 20, watch: [{ target: 'a', mode: 'value' }],
    });
    const session = createMonitorSession(def, { seriesCap: 5 }), controller = createController(def, { observer: (o) => session.observe(o) });
    const r = controller.run('max'); if (!r.ok) throw new Error('expected ok'); await r.done;
    const snap = session.snapshot(), st = snap.statistics.a;
    expect(snap.series.a).toHaveLength(5); expect(snap.series.a[0].tickIndex).toBe(16); expect(snap.series.a[4].value).toBe(20);
    if (st.kind !== 'numeric') throw new Error('expected numeric');
    expect(st.sampleCount).toBe(20); expect(st.average).toBe(10.5);
  });

  it('H2 Reset 保留初始化 Series 点，统计样本归零', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 7 } }, formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1, duration: 10, watch: [{ target: 'a', mode: 'value' }],
    });
    const { controller, session, reset } = createMonitoredRuntime(def);
    controller.step(); controller.step(); expect(session.snapshot().series.a).toHaveLength(3); reset();
    const snap = session.snapshot(), st = snap.statistics.a;
    expect(snap.series.a).toEqual([{ time: 0, tickIndex: 0, value: 7 }]); expect(snap.session.tickCount).toBe(0);
    if (st.kind !== 'numeric') throw new Error('expected numeric');
    expect(st.sampleCount).toBe(0); expect(st.sampleStdDev).toBeNull(); expect(st.initial).toBe(7);
  });
});
