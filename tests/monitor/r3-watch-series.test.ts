// R3 Monitoring 测试（Watch/Series 黄金案例与模式）：G1~G4。
import { describe, expect, it } from 'vitest';
import { createMonitorSession, createMonitoredRuntime } from '../../src/monitor/session';
import { makeTickDef } from '../runtime/fixtures';

function goldenDef(extraWatch?: { target: string; mode: 'value' | 'change' | 'threshold'; threshold?: number }) {
  return makeTickDef({
    variables: { fatigue: { type: 'number', value: 10 }, speed: { type: 'number', value: 5 }, rate: { type: 'number', value: 0.08 } },
    formulas: [{ id: 'f', target: 'fatigue', expression: 'fatigue + speed * rate * dt' }],
    tick: 1,
    duration: 10,
    watch: [{ target: 'fatigue', mode: 'change' }, ...(extraWatch ? [extraWatch] : [])],
  });
}

describe('R3 Monitoring · Watch 与 Series', () => {
  it('G1 黄金案例：Series (0,10)(1,10.4)(2,10.8)(3,11.2) + change 日志 + 完整统计', () => {
    const { controller, session } = createMonitoredRuntime(goldenDef());
    controller.step();
    controller.step();
    controller.step();
    const snap = session.snapshot();

    expect(snap.series.fatigue.map((p) => p.tickIndex)).toEqual([0, 1, 2, 3]);
    expect(snap.series.fatigue.map((p) => p.time)).toEqual([0, 1, 2, 3]);
    expect(snap.series.fatigue[0].value).toBe(10);
    expect(snap.series.fatigue[1].value).toBeCloseTo(10.4, 10);
    expect(snap.series.fatigue[2].value).toBeCloseTo(10.8, 10);
    expect(snap.series.fatigue[3].value).toBeCloseTo(11.2, 10);

    const changes = snap.logs.filter((l) => l.kind === 'change');
    expect(changes).toHaveLength(3);
    expect(changes[0].message).toContain('fatigue 10 →');
    expect(changes[0].time).toBe(1);
    expect(changes[2].tickIndex).toBe(3);

    const st = snap.statistics.fatigue;
    if (st.kind !== 'numeric') throw new Error('expected numeric');
    expect(st.initial).toBe(10);
    expect(st.current).toBeCloseTo(11.2, 10);
    expect(st.min).toBe(10);
    expect(st.max).toBeCloseTo(11.2, 10);
    expect(st.delta).toBeCloseTo(1.2, 10);
    expect(st.average).toBeCloseTo(10.6, 10);
    expect(st.sampleCount).toBe(4);
  });

  it('G2 value 模式：常量变量每 Tick 记录（无 change 日志）', () => {
    const { controller, session } = createMonitoredRuntime(goldenDef({ target: 'speed', mode: 'value' }));
    controller.step();
    controller.step();
    const snap = session.snapshot();
    expect(snap.series.speed.map((p) => p.tickIndex)).toEqual([0, 1, 2]);
    expect(snap.series.speed.every((p) => p.value === 5)).toBe(true);
    expect(snap.logs.filter((l) => l.kind === 'change' && l.target === 'speed')).toHaveLength(0);
  });

  it('G3 未知 target 防御：registry 跳过 + runtime 警告日志（第二道防线，不静默）', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      watch: [{ target: 'a', mode: 'value' }],
    });
    def.watch.push({ target: 'ghost', mode: 'value', operator: '>=' }); // 绕过 Loader 注入非法 watch
    const session = createMonitorSession(def);
    const snap = session.snapshot();
    expect(snap.watches).toHaveLength(1); // 仅保留合法 a
    expect(snap.series.ghost).toBeUndefined();
    const warns = snap.logs.filter((l) => l.kind === 'runtime' && l.level === 'warning');
    expect(warns).toHaveLength(1);
    expect(warns[0].message).toContain("'ghost' 不存在");
  });

  it('G4 threshold watch：false→true 触发一次，回落重武装可再触发', () => {
    const { controller, session } = createMonitoredRuntime(
      makeTickDef({
        variables: { a: { type: 'number', value: 0 } },
        formulas: [{ id: 'f', target: 'a', expression: '(a + 20) % 50' }],
        tick: 1,
        duration: 10,
        watch: [{ target: 'a', mode: 'threshold', threshold: 30 }],
      }),
    );
    for (let i = 0; i < 5; i++) controller.step(); // 20,40,10,30,0
    const crossings = session.snapshot().logs.filter((l) => l.kind === 'event');
    expect(crossings).toHaveLength(2);
    expect(crossings.map((l) => l.tickIndex)).toEqual([2, 4]);
    expect(crossings[0].level).toBe('warning');
    expect(crossings[0].source).toBe('watch:a');
    expect(crossings[0].message).toContain('阈值触发');
  });
});
