// UA1 focused test：21 类目录完整性 + Compatibility Engine 裁决 + 自动推荐规则（T10/T11/T12/T13）。
import { describe, expect, it } from 'vitest';
import { CATS, CATALOG, byId } from '../../../src/ui/viz/catalog';
import { checkVizById, recommend, type VizCtx } from '../../../src/ui/viz/compat';

const ctx = (o: Partial<VizCtx> = {}): VizCtx => ({ count: 1, mixedUnits: false, mode: 'absolute', hasThreshold: false, hasEvents: false, ...o });
const WORKING = ['line', 'area', 'step', 'bar', 'hbar', 'delta', 'scatter', 'gauge', 'range', 'timeline', 'table'];

describe('UA1 · Catalog 完整性（T10）', () => {
  it('21 类全部注册、8 大分类；可实现 11 类 data=series；其余不可实现者必须带 Disabled 理由', () => {
    expect(CATALOG).toHaveLength(21);
    expect(CATS.map((c) => c.id)).toEqual(['trend', 'compare', 'relation', 'state', 'composition', 'distribution', 'process', 'advanced']);
    for (const id of WORKING) expect(byId(id)?.data).toBe('series');
    for (const d of CATALOG) {
      if (!WORKING.includes(d.id) && d.id !== 'tband') expect(d.reason, d.id).not.toBe('');
    }
  });
});

describe('UA1 · Compatibility Engine（T11/T12）', () => {
  it('data≠series 直接 Disabled + 理由（不删入口、不伪造数据）', () => {
    for (const id of ['pie', 'hist', 'heatmap', 'etrack', 'depgraph']) expect(checkVizById(id, ctx({ count: 3 })).ok, id).toBe(false);
    expect(checkVizById('hist', ctx()).reason).toContain('多 Run');
  });
  it('数量上下限：scatter 恰 2 项；bar 上限 8；tband 需 threshold watch', () => {
    expect(checkVizById('scatter', ctx({ count: 1 })).ok).toBe(false);
    expect(checkVizById('scatter', ctx({ count: 3 })).ok).toBe(false);
    expect(checkVizById('scatter', ctx({ count: 2 })).ok).toBe(true);
    expect(checkVizById('bar', ctx({ count: 9 })).reason).toContain('最多');
    expect(checkVizById('tband', ctx()).ok).toBe(false);
    expect(checkVizById('tband', ctx({ hasThreshold: true })).ok).toBe(true);
  });
  it('绝对值 + 异单位 → Disabled 并提示切相对；scatter 不受同单位约束', () => {
    expect(checkVizById('line', ctx({ count: 2, mixedUnits: true })).reason).toBe('单位不一致——请切换「相对变化」');
    expect(checkVizById('scatter', ctx({ count: 2, mixedUnits: true })).ok).toBe(true);
  });
  it('相对模式：趋势族可用、gauge 等 rel=false 不可用', () => {
    expect(checkVizById('line', ctx({ mode: 'relative' })).ok).toBe(true);
    expect(checkVizById('gauge', ctx({ mode: 'relative' })).reason).toBe('不支持相对变化模式');
  });
});

describe('UA1 · 自动推荐（T13）', () => {
  it('1 指标 → Line/Range/Gauge；同单位多序列 → Line/Bar/Delta', () => {
    expect(recommend(ctx({ count: 1 }))).toEqual(['line', 'range', 'gauge']);
    expect(recommend(ctx({ count: 2 }))).toEqual(['line', 'bar', 'delta']);
  });
  it('异量纲两项 → Line + Scatter；有 threshold → 加 Threshold Band/Range；0 项 → Timeline', () => {
    expect(recommend(ctx({ count: 2, mixedUnits: true }))).toEqual(['line', 'scatter']);
    expect(recommend(ctx({ count: 1, hasThreshold: true }))).toEqual(['line', 'range', 'gauge', 'tband']);
    expect(recommend(ctx({ count: 0 }))).toEqual(['timeline']);
  });
});
