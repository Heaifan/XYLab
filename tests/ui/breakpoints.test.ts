// UI-F1 断点纯函数测试：三模式边界。
import { describe, expect, it } from 'vitest';
import { getBreakpoint, MEDIUM_MIN, WIDE_MIN } from '../../src/ui/shell/breakpoints';

describe('UI-F1 · 响应式断点', () => {
  it('Wide ≥1024（PC 横屏 / 平板横屏）', () => {
    expect(getBreakpoint(WIDE_MIN)).toBe('wide');
    expect(getBreakpoint(1920)).toBe('wide');
  });

  it('Medium 640~1023（平板竖屏 / 手机横屏）', () => {
    expect(getBreakpoint(MEDIUM_MIN)).toBe('medium');
    expect(getBreakpoint(768)).toBe('medium');
    expect(getBreakpoint(WIDE_MIN - 1)).toBe('medium');
  });

  it('Compact <640（手机竖屏）', () => {
    expect(getBreakpoint(MEDIUM_MIN - 1)).toBe('compact');
    expect(getBreakpoint(390)).toBe('compact');
    expect(getBreakpoint(430)).toBe('compact');
  });
});
