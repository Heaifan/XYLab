// R3 · 有界累积器：BoundedSeries（10000 点封顶，保最新）+ 数值/布尔统计。
// 冻结：历史禁止无限增长（R3 只做封顶，Downsampling 留待未来）。

import type { BooleanStatistics, NumericStatistics, SeriesPoint } from './types';
import type { RuntimeValue } from '../runtime/types';

export const DEFAULT_SERIES_CAP = 10000;
export const DEFAULT_LOG_CAP = 10000;

export class BoundedSeries {
  private points: SeriesPoint[] = [];

  constructor(private readonly cap: number = DEFAULT_SERIES_CAP) {}

  append(point: SeriesPoint): void {
    this.points.push(point);
    if (this.points.length > this.cap) {
      this.points = this.points.slice(this.points.length - this.cap); // 保留最新
    }
  }

  clear(): void {
    this.points = [];
  }

  all(): SeriesPoint[] {
    return this.points;
  }
}

export class NumericAccumulator {
  private first: number | null = null;
  private last = 0;
  private minV = Infinity;
  private maxV = -Infinity;
  private sum = 0;
  private count = 0;

  record(value: number): void {
    if (this.first === null) this.first = value;
    this.last = value;
    if (value < this.minV) this.minV = value;
    if (value > this.maxV) this.maxV = value;
    this.sum += value;
    this.count += 1;
  }

  snapshot(): NumericStatistics {
    const first = this.first ?? 0;
    return {
      kind: 'numeric',
      initial: first,
      current: this.last,
      min: this.count > 0 ? this.minV : first,
      max: this.count > 0 ? this.maxV : first,
      average: this.count > 0 ? this.sum / this.count : first,
      delta: this.last - first,
      sampleCount: this.count,
    };
  }
}

export class BooleanAccumulator {
  private first: boolean | null = null;
  private last = false;
  private changes = 0;

  record(value: boolean): void {
    if (this.first === null) this.first = value;
    else if (value !== this.last) this.changes += 1;
    this.last = value;
  }

  snapshot(): BooleanStatistics {
    return { kind: 'boolean', initial: this.first ?? false, current: this.last, changeCount: this.changes };
  }
}

export type WatchValue = RuntimeValue;
