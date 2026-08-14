// F2/STAT-1 focused test：ViewState 纯函数 + MetricRow Tick-only 统计模型。
import { describe, expect, it } from 'vitest';
import { createMonitoredRuntime } from '../../../src/monitor/session';
import { buildRows } from '../../../src/ui/monitor/metricModel';
import { VIEW_INIT, effectivePinned, sameUnitGroup, selectToggle, selectedTargets, viewClearSelect, viewFocus, viewToggleHide, viewTogglePin } from '../../../src/ui/viewState';
import { defOf, makeTickDef } from '../../runtime/fixtures';

const resolved = ['a', 'b', 'c'];

describe('F2→UA1 · ViewState 纯函数', () => {
  it('选择 = Set 语义：普通点击 Toggle 增删、立即生效；空选择不再回退首个', () => {
    expect(selectedTargets(VIEW_INIT, resolved)).toEqual([]);
    let v = selectToggle(VIEW_INIT, null, 'a').view;
    v = selectToggle(v, null, 'b').view;
    expect(selectedTargets(v, resolved)).toEqual(['a', 'b']);
    v = selectToggle(v, null, 'a').view;
    expect(selectedTargets(v, resolved)).toEqual(['b']);
    expect(selectedTargets(viewClearSelect(v), resolved)).toEqual([]);
  });
  it('聚焦单选与 hidden 过滤：hidden 只从图表隐藏不删 watch', () => {
    expect(selectedTargets(viewFocus(VIEW_INIT, 'c'), resolved)).toEqual(['c']);
    const v = viewToggleHide(viewFocus(VIEW_INIT, 'c'), 'c');
    expect(selectedTargets(v, resolved)).toEqual([]);
    expect(v.hidden).toEqual(['c']);
  });
  it('绝对值对比只许同单位：与首个目标单位不同者被排除', () => {
    const def = makeTickDef({
      variables: { x: { type: 'number', value: 0 }, y: { type: 'number', value: 0 }, z: { type: 'number', value: 0 } },
      tick: 1, duration: 1,
    });
    def.variables.x.unit = '人'; def.variables.y.unit = '人'; def.variables.z.unit = '%';
    expect(sameUnitGroup(def, ['x', 'y', 'z'])).toEqual({ shown: ['x', 'y'], excluded: ['z'] });
    expect(sameUnitGroup(def, ['x'])).toEqual({ shown: ['x'], excluded: [] });
  });
  it('Pin 自动取解析目标前六；显式增删受 PIN_CAP 与 resolved 过滤', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    expect(effectivePinned(VIEW_INIT, many)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    let v = viewTogglePin(VIEW_INIT, 'g', many);
    expect(effectivePinned(v, many)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    v = viewTogglePin(v, 'a', many);
    expect(effectivePinned(v, many)).toEqual(['b', 'c', 'd', 'e', 'f', 'g']);
    const ghost = viewTogglePin(VIEW_INIT, 'ghost', ['a', 'b']);
    expect(effectivePinned(ghost, ['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('F2 · MetricRow 模型', () => {
  function labDef() {
    return defOf({
      schema: 'xylab-experiment@0.1',
      experiment: { id: 't-f2', name: 'F2' },
      variables: { fatigue: { type: 'number', value: 0, label: '疲劳度', unit: '%' }, flag: { type: 'boolean', value: false, label: '标志' } },
      formulas: [{ id: 'f1', target: 'fatigue', expression: 'fatigue + 2' }, { id: 'f2', target: 'flag', expression: 'fatigue > 3' }],
      watch: [{ target: 'fatigue', mode: 'value' }, { target: 'flag', mode: 'value' }],
      timeline: { mode: 'fixed_tick', tick: 1, duration: 10 },
    });
  }
  it('第一/二层：label/单位/实时值/Δ 与 Tick-only mean·σ·n', () => {
    const d = labDef(), rt = createMonitoredRuntime(d);
    rt.controller.step(); rt.controller.step();
    const r = buildRows(d, rt.session.snapshot(), null).find((x) => x.target === 'fatigue')!;
    expect(r.label).toBe('疲劳度'); expect(r.unit).toBe('%'); expect(r.modeText).toBe('实时值');
    expect(r.value).toBe('4.00'); expect(r.deltaDir).toBe('up');
    expect(r.stats).toMatchObject({ min: '2', max: '4', average: '3', samples: 2 });
    expect(r.stats?.stddev).not.toBe('—');
  });
  it('boolean 行给变化次数文本；无统计目标绝不伪造统计', () => {
    const d = labDef(), rt = createMonitoredRuntime(d);
    rt.controller.step(); rt.controller.step(); rt.controller.step();
    const f = buildRows(d, rt.session.snapshot(), null).find((x) => x.target === 'flag')!;
    expect(f.detail).toContain('次变化'); expect(f.stats).toBeNull();
  });
  it('锁定模式读目标时刻 series（不是最新值）', () => {
    const d = labDef(), rt = createMonitoredRuntime(d);
    rt.controller.step(); rt.controller.step(); rt.controller.step();
    const locked = buildRows(d, rt.session.snapshot(), 1).find((x) => x.target === 'fatigue')!;
    expect(locked.value).toBe('2.00');
  });
});
