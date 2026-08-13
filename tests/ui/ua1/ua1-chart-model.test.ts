// UA1 focused test：图表数据纯函数——barRows 时间点读取/相对/Delta + Zero Baseline 防护；scatterPairs 同 Tick 配对；relSkipped。
import { describe, expect, it } from 'vitest';
import type { SeriesPoint } from '../../../src/monitor/types';
import { barRows } from '../../../src/ui/charts/bars';
import { scatterPairs } from '../../../src/ui/charts/scatter';
import { relBase, relSkipped } from '../../../src/ui/viz/shared';

const pt = (time: number, value: number | string): SeriesPoint => ({ time, tickIndex: time, value });
const series = {
  a: [pt(0, 10), pt(1, 20), pt(2, 30), pt(3, 40)],
  z: [pt(0, 0), pt(1, 5)],
  s: [pt(0, 'init'), pt(1, 'x')],
};

describe('UA1 · barRows 时间点语义（场景 E：锁定后柱状读锁定 Tick 值）', () => {
  it('绝对值：读取 <= t 的最后一点（锁 2s → 30）', () => {
    expect(barRows(series, ['a'], 'absolute', null, 2, 'bar')).toEqual([{ tg: 'a', v: 30, unit: '' }]);
  });
  it('相对：起始值 100%（t=3 → 400%）；delta：绝对差与相对差', () => {
    expect(barRows(series, ['a'], 'relative', null, 3, 'hbar')[0].v).toBe(400);
    expect(barRows(series, ['a'], 'absolute', null, 3, 'delta')[0].v).toBe(30);
    expect(barRows(series, ['a'], 'relative', null, 3, 'delta')[0].v).toBe(300);
  });
  it('Zero Baseline：基线 0 / 非数值 → 跳过该行，绝不产生 NaN/Infinity/假 100%', () => {
    expect(barRows(series, ['z'], 'relative', null, 1, 'bar')).toEqual([]);
    expect(barRows(series, ['s'], 'relative', null, 1, 'bar')).toEqual([]);
    expect(barRows(series, ['z'], 'absolute', null, 1, 'delta')).toEqual([]); // 基线 0 → Delta 同样跳过（统一 Zero Baseline 防护）
  });
  it('相对模式单位统一为 %', () => {
    expect(barRows(series, ['a'], 'relative', null, 1, 'bar')[0].unit).toBe('%');
  });
});

describe('UA1 · relSkipped & scatterPairs', () => {
  it('相对模式跳过基线 0/非数值目标（趋势图标注来源）', () => {
    expect(relSkipped('relative', ['a', 'z', 's'], series)).toEqual(['z', 's']);
    expect(relSkipped('absolute', ['a', 'z'], series)).toEqual([]);
    expect(relBase(series.a)).toBe(10);
  });
  it('Scatter 仅同 Tick 配对：时间错位不构成点（场景 D）', () => {
    const mixed = { x: series.a, y: [pt(0, 1), pt(1, 2), pt(3, 4)] };
    expect(scatterPairs(mixed, 'x', 'y')).toEqual([{ x: 10, y: 1 }, { x: 20, y: 2 }, { x: 40, y: 4 }]);
  });
});
