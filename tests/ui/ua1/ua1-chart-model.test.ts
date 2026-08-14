// UA1 focused test：barRows + Scatter 配对/径向 σ/统计验证/密度策略。
import { describe, expect, it } from 'vitest';
import type { SeriesPoint } from '../../../src/monitor/types';
import { barRows } from '../../../src/ui/charts/bars';
import { scatterDistributionStats, scatterDotVisual, scatterExtent, scatterOutsideReference, scatterPairs } from '../../../src/ui/charts/scatter';
import { relBase, relSkipped } from '../../../src/ui/viz/shared';

const pt = (time: number, value: number | string, tickIndex = time): SeriesPoint => ({ time, tickIndex, value });
const series = { a: [pt(0,10,0),pt(1,20),pt(2,30),pt(3,40)], z: [pt(0,0,0),pt(1,5)], s: [pt(0,'init',0),pt(1,'x')] };

describe('UA1 · barRows 时间点语义', () => {
  it('绝对值读取 <= t 的最后一点', () => expect(barRows(series,['a'],'absolute',null,2,'bar')).toEqual([{tg:'a',v:30,unit:''}]));
  it('相对/Delta 正确', () => {
    expect(barRows(series,['a'],'relative',null,3,'hbar')[0].v).toBe(400);
    expect(barRows(series,['a'],'absolute',null,3,'delta')[0].v).toBe(30);
    expect(barRows(series,['a'],'relative',null,3,'delta')[0].v).toBe(300);
  });
  it('Zero Baseline 不产生假值', () => {
    expect(barRows(series,['z'],'relative',null,1,'bar')).toEqual([]);
    expect(barRows(series,['s'],'relative',null,1,'bar')).toEqual([]);
    expect(barRows(series,['z'],'absolute',null,1,'delta')).toEqual([]);
  });
  it('相对单位为 %', () => expect(barRows(series,['a'],'relative',null,1,'bar')[0].unit).toBe('%'));
});

describe('UA1 · Scatter 模型', () => {
  it('相对模式基线辅助不回退', () => {
    expect(relSkipped('relative',['a','z','s'],series)).toEqual(['z','s']);
    expect(relSkipped('absolute',['a','z'],series)).toEqual([]);
    expect(relBase(series.a)).toBe(10);
  });
  it('仅同 Tick 配对并排除初始化样本', () => {
    const mixed={x:series.a,y:[pt(0,1,0),pt(1,2),pt(3,4)]};
    expect(scatterPairs(mixed,'x','y')).toEqual([{x:20,y:2},{x:40,y:4}]);
  });
  it('参考范围固定 ±3σ；超界按径向而非正方形判定', () => {
    const pts=[{x:.1,y:-.2},{x:.5,y:.5},{x:.95,y:.1}];
    expect(scatterExtent(pts,.2,'reference')).toBeCloseTo(.648);
    expect(scatterExtent(pts,.2,'all')).toBeCloseTo(1.026);
    expect(scatterOutsideReference(pts,.2)).toBe(2);
  });
  it('千发点自动减小并透明化', () => {
    expect(scatterDotVisual(1000)).toEqual({r:1.7,opacity:.62});
    expect(scatterDotVisual(100)).toEqual({r:2.5,opacity:.9});
  });
  it('二维正态统计按径向理论概率判定', () => {
    const pts=[{x:0,y:0},{x:.1,y:0},{x:0,y:.1},{x:.15,y:.15},{x:.4,y:0},{x:.7,y:0}];
    const s=scatterDistributionStats(pts,.2);
    expect(s.bands[0].theory).toBeCloseTo(1-Math.exp(-.5));
    expect(s.bands[1].theory).toBeCloseTo(1-Math.exp(-2));
    expect(s.bands[2].theory).toBeCloseTo(1-Math.exp(-4.5));
    expect(s.bands[2].count).toBe(5);
  });
});