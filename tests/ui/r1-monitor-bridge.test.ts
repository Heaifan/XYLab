// FE-A-R1 focused test：Monitored Runtime Handle 生命周期（UI 实际消费路径）。
// 语义对应 R1-T01/T02/T04/T09/T10/T11/T12/T13/T14/T15。
import { describe, expect, it } from 'vitest';
import { createMonitoredRuntime } from '../../src/monitor/session';
import { withInitialValues } from '../../src/ui/experiment/draft';
import { canPause, canResume, canRun, canStep, canStop } from '../../src/runtime/controller/transitions';
import { drain, instantScheduler, manualScheduler } from '../runtime/controls/helpers';
import { makeTickDef } from '../runtime/fixtures';

function watchDef(duration = 10) {
  return makeTickDef({
    variables: { a: { type: 'number', value: 0 } }, formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
    tick: 1, duration, watch: [{ target: 'a', mode: 'value' }],
  });
}
describe('FE-A-R1 · Monitored Runtime Handle 生命周期', () => {
  it('T01 Load 创建 Controller + MonitorSession 同一生命周期', () => {
    const h = createMonitoredRuntime(watchDef());
    expect(h.controller.status).toBe('ready');
    const snap = h.session.snapshot();
    expect(snap.watches.map((w) => w.target)).toEqual(['a']);
    expect(snap.series.a).toHaveLength(1); expect(snap.session.tickCount).toBe(0); // time=0 初始点
  });
  it('T04 Series 随成功 Tick 增长', () => {
    const h = createMonitoredRuntime(watchDef());
    h.controller.step(); h.controller.step(); h.controller.step();
    const snap = h.session.snapshot();
    expect(snap.series.a).toHaveLength(4); expect(snap.series.a[3].value).toBe(3); expect(snap.session.tickCount).toBe(3);
  });
  it('T02/T13 Apply 参数 = 新 Definition 全新 Handle：不继承旧 Series/Log/Statistics', () => {
    const def = watchDef();
    const old = createMonitoredRuntime(def);
    old.controller.step(); old.controller.step();
    const snap = createMonitoredRuntime(withInitialValues(def, { a: 50 })).session.snapshot();
    expect(snap.series.a[0].value).toBe(50); // 新 Initial
    expect(snap.series.a).toHaveLength(1); expect(snap.logs).toHaveLength(0);
    expect(snap.statistics.a).toMatchObject({ current: 50, sampleCount: 1 });
    expect(old.session.snapshot().series.a).toHaveLength(3); // 旧 Session 零影响
  });
  it('T09 Pause 冻结监控历史；T10 Resume 沿原 Session 连续增长', async () => {
    const m = manualScheduler();
    const h = createMonitoredRuntime(watchDef(100), m.scheduler);
    h.controller.run('x10'); // 首批 10 tick 同步执行后挂起
    h.controller.pause();
    const frozen = h.session.snapshot().series.a.length;
    expect(frozen).toBe(11);
    m.release(); // 旧循环苏醒：代际取消 → 零写入
    await new Promise((r) => setTimeout(r, 0));
    expect(h.session.snapshot().series.a).toHaveLength(frozen);
    h.controller.resume();
    await drain(h.controller, m);
    const series = h.session.snapshot().series.a;
    expect(series).toHaveLength(101);
    expect(series.map((p) => p.tickIndex)).toEqual(Array.from({ length: 101 }, (_, i) => i));
  });
  it('T11 Stop 保留监控证据', () => {
    const m = manualScheduler();
    const h = createMonitoredRuntime(watchDef(100), m.scheduler);
    h.controller.run('x10');
    h.controller.stop();
    expect(h.controller.status).toBe('stopped');
    expect(h.session.snapshot().series.a.length).toBeGreaterThan(1);
  });
  it('T12 handle.reset() = Runtime + Session 联合重置', () => {
    const h = createMonitoredRuntime(watchDef());
    h.controller.step(); h.controller.step();
    h.reset();
    expect(h.controller.status).toBe('ready');
    expect(h.controller.state.time).toBe(0);
    expect(h.controller.state.variables.a).toBe(0);
    const snap = h.session.snapshot();
    expect(snap.series.a).toHaveLength(1); expect(snap.logs).toHaveLength(0);
    expect(snap.statistics.a).toMatchObject({ kind: 'numeric', current: 0, sampleCount: 1 });
  });
  it('T14 Failed 保留失败前证据', async () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 }, b: { type: 'number', value: 0 } },
      formulas: [{ id: 'f1', target: 'a', expression: 'a + 1' }, { id: 'f2', target: 'b', expression: '1 / b' }],
      tick: 1, duration: 5, watch: [{ target: 'a', mode: 'value' }],
    });
    const h = createMonitoredRuntime(def, instantScheduler());
    const r = h.controller.run('max');
    if (!r.ok) throw new Error('expected ok');
    await r.done;
    expect(h.controller.status).toBe('failed');
    const snap = h.session.snapshot();
    expect(snap.session.failure).not.toBeNull();
    expect(snap.series.a.length).toBeGreaterThanOrEqual(1);
    expect(snap.logs.some((l) => l.kind === 'runtime' && l.level === 'critical')).toBe(true);
  });
  it('T15 transitions 守卫经 Handle 零回退', () => {
    const h = createMonitoredRuntime(watchDef());
    expect(canRun(h.controller.status)).toBe(true); expect(canPause(h.controller.status)).toBe(false);
    expect(canStop(h.controller.status)).toBe(false); expect(canStep(h.controller.status)).toBe(true);
    h.controller.step();
    expect(canResume(h.controller.status)).toBe(true); expect(canRun(h.controller.status)).toBe(false);
  });
});
