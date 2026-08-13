// UA1 · 可视化共享层：画布常量 / 宽度观测 / 相对基线 / 范围钳制 / 标签——各图表统一消费，不各自发明。
// 相对基线冻结（F2 延续）：运行起始值 = 首个数值点，作为 100%；基线 0/非数值 → 调用方跳过并提示。
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { ExperimentDefinition } from '../../protocol/types';
import type { SeriesPoint } from '../../monitor/types';

export const H = 220;
export const PAD = { l: 40, r: 8, t: 8, b: 22 };
export const GRID = [0.25, 0.5, 0.75];

export function useWidth(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(340);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(200, el.clientWidth)));
    ro.observe(el);
    setW(Math.max(200, el.clientWidth));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function relBase(pts: SeriesPoint[]): number | null {
  const p = pts.find((q) => typeof q.value === 'number');
  return p ? (p.value as number) : null;
}

// 相对模式下基线为 0 / 非数值的目标：禁止 NaN/Infinity/假 100%，一律跳过并提示
export function relSkipped(mode: 'absolute' | 'relative', targets: string[], series: Record<string, SeriesPoint[]>): string[] {
  if (mode !== 'relative') return [];
  return targets.filter((tg) => {
    const b = relBase(series[tg] ?? []);
    return b === null || b === 0;
  });
}

export function padRange(lo: number, hi: number): { lo: number; hi: number } {
  if (!Number.isFinite(lo)) {
    lo = 0;
    hi = 1;
  }
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  return { lo, hi };
}

export function labelOf(def: ExperimentDefinition | null, t: string): string {
  return def?.variables[t]?.label ?? t;
}
