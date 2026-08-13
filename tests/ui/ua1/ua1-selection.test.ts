// UA1 focused test：选择初始化（output.charts 优先 / fallback）+ Set 多选模型（toggle/solo/清空/viz 指派）。
import { describe, expect, it } from 'vitest';
import type { ExperimentDefinition } from '../../../src/protocol/types';
import { VIEW_INIT, initSelection, selectToggle, selectedTargets, viewClearSelect, viewFocus, viewSetViz, viewSwapScatter } from '../../../src/ui/viewState';
import { makeTickDef } from '../../runtime/fixtures';

function def3(): ExperimentDefinition {
  return makeTickDef({
    variables: { a: { type: 'number', value: 0 }, b: { type: 'number', value: 0 }, flag: { type: 'boolean', value: false } },
    watch: [{ target: 'a', mode: 'value' }, { target: 'b', mode: 'value' }, { target: 'flag', mode: 'change' }],
    tick: 1, duration: 4,
  });
}

describe('UA1 · 选择初始化（T09）', () => {
  it('output.charts 声明优先：仅 x=time 数值目标，去重、非数值与非 time 轴排除', () => {
    const def: ExperimentDefinition = {
      ...def3(),
      output: { summary: [], charts: [{ x: 'time', y: 'b' }, { x: 'time', y: 'a' }, { x: 'time', y: 'b' }, { x: 'time', y: 'flag' }, { x: 'entity', y: 'a' }] },
    };
    expect(initSelection(def)).toEqual(['b', 'a']);
  });
  it('无声明 → fallback 第一个 numeric watch；null def 为空', () => {
    expect(initSelection(def3())).toEqual(['a']);
    expect(initSelection(null)).toEqual([]);
  });
});

describe('UA1 · Set 多选模型（T04/T05/T06）', () => {
  it('toggle 只动 selected，其余视图字段原样保留（选择 = UI 工作状态）', () => {
    const v0 = { ...VIEW_INIT, viz: 'bar', mode: 'relative' as const, scatterX: 'a', scatterY: 'b' };
    const r = selectToggle(v0, null, 'a');
    expect(r.view.selected).toEqual(['a']);
    expect(r.view.viz).toBe('bar');
    expect(r.view.mode).toBe('relative');
    expect(selectToggle(r.view, null, 'a').view.selected).toEqual([]); // 再点 = 移出
  });
  it('solo / 清空 / viz 指派 / Scatter 交换均为纯函数且不耦合模拟状态', () => {
    expect(selectedTargets(viewFocus(VIEW_INIT, 'b'), ['a', 'b'])).toEqual(['b']);
    expect(viewClearSelect({ ...VIEW_INIT, selected: ['a'] }).selected).toEqual([]);
    expect(viewSetViz(VIEW_INIT, 'gauge').viz).toBe('gauge');
    const s = viewSwapScatter(VIEW_INIT, 'a', 'b');
    expect([s.scatterX, s.scatterY]).toEqual(['b', 'a']);
  });
  it('hidden 目标不进图表（选择保留、展示过滤）', () => {
    const v = { ...VIEW_INIT, selected: ['a', 'b'], hidden: ['b'] };
    expect(selectedTargets(v, ['a', 'b'])).toEqual(['a']);
  });
});
