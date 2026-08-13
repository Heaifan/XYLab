// FE-A-R2 focused test：移动优先工作台数据流（R2-T01/T03/T04/T05/T06/T07/T08）。
import { describe, expect, it } from 'vitest';
import { createMonitoredRuntime } from '../../../src/monitor/session';
import { definitionJson } from '../../../src/ui/actions/clipboard';
import { withInitialValues } from '../../../src/ui/experiment/draft';
import { resolveMetrics } from '../../../src/ui/visualization/MetricStrip';
import { resolveChartTargets } from '../../../src/ui/visualization/VisualizationPanel';
import { drain, manualScheduler } from '../../runtime/controls/helpers';
import { makeTickDef } from '../../runtime/fixtures';

function labDef() {
  return makeTickDef({
    variables: { fatigue: { type: 'number', value: 0 }, fatigue_rate: { type: 'number', value: 0.05 } },
    formulas: [{ id: 'grow', target: 'fatigue', expression: 'fatigue + fatigue_rate * 10 * dt' }],
    watch: [{ target: 'fatigue', mode: 'value' }],
    tick: 1, duration: 200,
  });
}

describe('FE-A-R2 · 工作台数据流', () => {
  it('T01：Load 后首屏 Metric + Chart 同时存在（全部来自快照）', () => {
    const def = labDef();
    const snap = createMonitoredRuntime(def).session.snapshot();
    expect(resolveMetrics(def, snap, null)).toHaveLength(1);
    expect(resolveChartTargets(def, snap)).toEqual(['fatigue']);
  });
  it('T03/T04：Pause 曲线冻结；Resume 延续同一 Series（图表只读 series）', async () => {
    const m = manualScheduler();
    const h = createMonitoredRuntime(labDef(), m.scheduler);
    h.controller.run('x10'); // 首批同步执行后挂起
    h.controller.pause();
    const frozen = h.session.snapshot().series.fatigue.length;
    expect(frozen).toBeGreaterThan(1);
    m.release(); // 旧循环苏醒：代际取消 → 零写入
    await new Promise((r) => setTimeout(r, 0));
    expect(h.session.snapshot().series.fatigue).toHaveLength(frozen);
    h.controller.resume();
    await drain(h.controller, m);
    const series = h.session.snapshot().series.fatigue;
    expect(series).toHaveLength(201); // 同一 Series 连续到 completed（0~200）
    expect(series.map((p) => p.tickIndex)).toEqual(Array.from({ length: 201 }, (_, i) => i));
  });
  it('T05：Reset 后 Chart 回到初始点', () => {
    const h = createMonitoredRuntime(labDef());
    h.controller.step();
    h.controller.step();
    h.reset(); // Runtime + MonitorSession 联合重置
    const snap = h.session.snapshot();
    expect(snap.series.fatigue).toHaveLength(1);
    expect(snap.series.fatigue[0].time).toBe(0);
    expect(snap.logs).toHaveLength(0);
  });
  it('T06：参数 Apply 后旧 Series 不残留（全新句柄，单一初始点）', () => {
    const def = labDef();
    const old = createMonitoredRuntime(def);
    old.controller.step();
    old.controller.step();
    const next = withInitialValues(def, { fatigue_rate: 0.08 });
    const snap = createMonitoredRuntime(next).session.snapshot();
    expect(snap.series.fatigue).toHaveLength(1);
    expect(snap.series.fatigue[0].value).toBe(0);
    expect(Object.keys(snap.series)).toEqual(['fatigue']);
  });
  it('T07：参数 Apply 后 Copy JSON 是新 Definition', () => {
    const def = labDef();
    const next = withInitialValues(def, { fatigue_rate: 0.08 });
    const json = definitionJson(next);
    expect(JSON.parse(json).variables.fatigue_rate.value).toBe(0.08);
    expect(json).not.toContain('0.05');
  });
  it('T08：Copy JSON 不复制旧 Draft（未应用的草稿不进 Definition）', () => {
    const def = labDef();
    const overrides = { fatigue_rate: 0.2 }; // 未 Apply 的草稿
    const json = definitionJson(def);
    expect(JSON.parse(json).variables.fatigue_rate.value).toBe(0.05);
    expect(json).not.toContain('"value": 0.2');
    expect(json).not.toContain('overrides');
    expect(overrides.fatigue_rate).toBe(0.2); // 草稿仍留在 UI 状态，只是不进 JSON
  });
});
