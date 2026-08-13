// FE-A-R2 focused test：图表模型纯函数（R2-T02/T16 + output.charts 优先 / numeric fallback / 结构化状态）。
import { describe, expect, it } from 'vitest';
import { createMonitoredRuntime } from '../../../src/monitor/session';
import type { ExperimentDefinition } from '../../../src/protocol/types';
import { metricStatus, nearestTime, resolveMetrics, valueAtTime } from '../../../src/ui/monitor/metricModel';
import { resolveChartTargets } from '../../../src/ui/visualization/VisualizationPanel';
import { makeTickDef } from '../../runtime/fixtures';

function mixedRuntime() {
  const def = makeTickDef({
    variables: { b: { type: 'number', value: 0 }, a: { type: 'boolean', value: false }, note: { type: 'string', value: 'x' } },
    formulas: [{ id: 'f-b', target: 'b', expression: 'b + 2' }, { id: 'f-a', target: 'a', expression: 'b >= 3' }],
    watch: [{ target: 'b', mode: 'value' }, { target: 'a', mode: 'value' }, { target: 'note', mode: 'change' }],
    tick: 1, duration: 10,
  });
  return { def, rt: createMonitoredRuntime(def) };
}

describe('FE-A-R2 · 图表模型', () => {
  it('T02：Chart 数据唯一来源 MonitorSnapshot.series（fallback 排除 boolean/string）', () => {
    const { rt } = mixedRuntime();
    rt.controller.step();
    rt.controller.step();
    const snap = rt.session.snapshot();
    expect(resolveChartTargets(null, snap)).toEqual(['b']);
    const pts = snap.series.b;
    expect(valueAtTime(pts, pts[pts.length - 1].time)).toEqual(pts[pts.length - 1]);
  });
  it('T16：Tap Lock 读取目标时间点 Series（<=t 最后一点；首点前取首点；空 series 为 null）', () => {
    const { rt } = mixedRuntime();
    rt.controller.step();
    rt.controller.step();
    rt.controller.step(); // b 采样 t=0,1,2,3
    const pts = rt.session.snapshot().series.b;
    expect(valueAtTime(pts, 2.5)?.time).toBe(2);
    expect(valueAtTime(pts, 0)?.time).toBe(0);
    expect(valueAtTime(pts, -1)?.time).toBe(0);
    expect(valueAtTime([], 5)).toBeNull();
    expect(nearestTime([pts], 2.4)).toBe(2);
    expect(nearestTime([pts], 2.6)).toBe(3);
    expect(nearestTime([], 1)).toBeNull();
  });
  it('output.charts 声明优先（x 必须 = time；未声明 y 跳过；不解析任何 expression）', () => {
    const { def, rt } = mixedRuntime();
    rt.controller.step();
    const snap = rt.session.snapshot();
    const withCharts: ExperimentDefinition = {
      ...def,
      output: { summary: [], charts: [{ x: 'time', y: 'a' }, { x: 'entity', y: 'b' }, { x: 'time', y: 'ghost' }] },
    };
    expect(resolveChartTargets(withCharts, snap)).toEqual(['a']);
  });
  it('fallback 最多前 4 个 Numeric watch', () => {
    const def = makeTickDef({
      variables: {
        v1: { type: 'number', value: 0 }, v2: { type: 'number', value: 0 }, v3: { type: 'number', value: 0 },
        v4: { type: 'number', value: 0 }, v5: { type: 'number', value: 0 },
      },
      watch: [
        { target: 'v1', mode: 'value' }, { target: 'v2', mode: 'value' }, { target: 'v3', mode: 'value' },
        { target: 'v4', mode: 'value' }, { target: 'v5', mode: 'value' },
      ],
      tick: 1, duration: 2,
    });
    expect(resolveChartTargets(def, createMonitoredRuntime(def).session.snapshot())).toEqual(['v1', 'v2', 'v3', 'v4']);
  });
  it('Metric 状态只由结构化 threshold watch 判定（event expression 不参与）', () => {
    const def = makeTickDef({
      variables: { f: { type: 'number', value: 0 } },
      formulas: [{ id: 'g', target: 'f', expression: 'f + 40' }],
      watch: [{ target: 'f', mode: 'threshold', threshold: 70, operator: '>=' }],
      tick: 1, duration: 10,
    });
    const rt = createMonitoredRuntime(def);
    expect(metricStatus(rt.session.snapshot(), 'f')).toBe('normal');
    rt.controller.step();
    rt.controller.step(); // f = 80 >= 70
    expect(metricStatus(rt.session.snapshot(), 'f')).toBe('warning');
    expect(resolveMetrics(def, rt.session.snapshot(), null)[0].status).toBe('warning');
  });
});
