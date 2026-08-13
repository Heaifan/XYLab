// FE-A-R2 focused test：数值显示格式化（R2-T15）。只格式化显示，底层值不 Round。
import { describe, expect, it } from 'vitest';
import { formatMetric, formatNumber, formatValue } from '../../../src/ui/format';

describe('FE-A-R2 · 数值格式化', () => {
  it('T15a：浮点噪声消失（0.30000000000000004 / 99.75999999999999 / 1.2000000000000002）', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(99.75999999999999)).toBe('99.76');
    expect(formatNumber(1.2000000000000002)).toBe('1.2');
  });
  it('T15b：整数 0 位', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(70)).toBe('70');
    expect(formatNumber(-12)).toBe('-12');
  });
  it('T15c：一般浮点最多 4 位', () => {
    expect(formatNumber(1.23456789)).toBe('1.2346');
    expect(formatNumber(0.0001)).toBe('0.0001');
  });
  it('T15d：Metric 强调值固定 2 位', () => {
    expect(formatMetric(70)).toBe('70.00');
    expect(formatMetric(99.75999999999999)).toBe('99.76');
    expect(formatMetric(1.2)).toBe('1.20');
  });
  it('T15e：非数值原样；NaN/Infinity 不抛异常', () => {
    expect(formatValue(true)).toBe('true');
    expect(formatValue('x')).toBe('x');
    expect(formatValue(3)).toBe('3');
    expect(formatNumber(Number.NaN)).toBe('NaN');
    expect(formatMetric(Number.POSITIVE_INFINITY)).toBe('Infinity');
  });
});
