// UI-F1 · 响应式断点（纯函数，可单测）。
// 冻结三模式：Wide ≥1024（PC 横屏 / 平板横屏）；Medium ≥640（平板竖屏 / 手机横屏）；Compact <640（手机竖屏）。
export type Breakpoint = 'wide' | 'medium' | 'compact';

export const WIDE_MIN = 1024;
export const MEDIUM_MIN = 640;

export function getBreakpoint(width: number): Breakpoint {
  if (width >= WIDE_MIN) return 'wide';
  if (width >= MEDIUM_MIN) return 'medium';
  return 'compact';
}
