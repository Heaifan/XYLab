// R3 Monitoring 测试（Session 生命周期对齐）：L1~L5。
import { describe, expect, it } from 'vitest';
import { createMonitoredRuntime } from '../../src/monitor/session';
import { drain, instantScheduler, manualScheduler } from '../runtime/controls/helpers';
import { makeTickDef } from '../runtime/fixtures';

function valueDef(duration: number) {
  return makeTickDef({
    variables: { a: { type: 'number', value: 0 } },
    formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
    tick: 1,
    duration,
    watch: [{ target: 'a', mode: 'value' }],
  });
}

describe('R3 Monitoring · Session 生命周期', () => {
  it('L1 Run→Completed：保留最终历史与统计', async () => {
    const { controller, session } = createMonitoredRuntime(valueDef(5), instantScheduler());
    const r = controller.run('max');
    if (!r.ok) throw new Error('expected ok');
    await r.done;
    expect(controller.status).toBe('completed');
    const snap = session.snapshot();
    expect(snap.series.a).toHaveLength(6); // 初始 + 5 Tick
    expect(snap.session.tickCount).toBe(5);
    expect(snap.session.lastTickIndex).toBe(5);
    expect(snap.session.lastTime).toBe(5);
  });

  it('L2 Run→Failed：保留失败前数据 + Runtime Failure 日志', async () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 }, b: { type: 'number', value: 0 } },
      formulas: [
        { id: 'f1', target: 'a', expression: 'a + 1' },
        { id: 'f2', target: 'b', expression: '1 / b' },
      ],
      tick: 1,
      duration: 5,
      watch: [{ target: 'a', mode: 'value' }],
    });
    const { controller, session } = createMonitoredRuntime(def, instantScheduler());
    const r = controller.run('max');
    if (!r.ok) throw new Error('expected ok');
    await r.done;
    expect(controller.status).toBe('failed');
    const snap = session.snapshot();
    expect(snap.session.failure).not.toBeNull();
    expect(snap.logs.some((l) => l.kind === 'runtime' && l.level === 'critical')).toBe(true);
    expect(snap.series.a).toHaveLength(1);
  });

  it('L3 Pause/Resume：历史保留且连续追加，无重复无缺口', async () => {
    const m = manualScheduler();
    const { controller, session } = createMonitoredRuntime(valueDef(100), m.scheduler);
    controller.run('x10'); // 首批 10 tick 同步执行后挂起
    controller.pause();
    controller.resume();
    await drain(controller, m);
    expect(controller.status).toBe('completed');
    const series = session.snapshot().series.a;
    expect(series).toHaveLength(101);
    expect(series.map((p) => p.tickIndex)).toEqual(Array.from({ length: 101 }, (_, i) => i));
    expect(series[100].value).toBe(100);
  });

  it('L4 Stop：保留本次历史，不再追加', () => {
    const m = manualScheduler();
    const { controller, session } = createMonitoredRuntime(valueDef(100), m.scheduler);
    controller.run('x10'); // 10 tick 后挂起
    controller.stop();
    const first = JSON.stringify(session.snapshot().series.a);
    expect(session.snapshot().series.a).toHaveLength(11);
    expect(JSON.stringify(session.snapshot().series.a)).toBe(first); // Stop 后零追加
  });

  it('L5 Reset：清空日志/统计/edge-state，事件可再次触发', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 45' }],
      tick: 1,
      duration: 10,
      watch: [{ target: 'a', mode: 'value' }],
      events: [{ id: 'high', when: 'a >= 70', message: '高', level: 'warning' }],
    });
    const { controller, session, reset } = createMonitoredRuntime(def);
    controller.step(); // 45
    controller.step(); // 90 → 触发
    expect(session.snapshot().logs.filter((l) => l.kind === 'event')).toHaveLength(1);
    reset();
    expect(session.snapshot().logs).toHaveLength(0); // 全部证据清空
    expect(session.snapshot().series.a).toHaveLength(1); // 仅重建的初始点
    controller.step();
    controller.step();
    expect(session.snapshot().logs.filter((l) => l.kind === 'event')).toHaveLength(1); // 再次触发
  });
});
