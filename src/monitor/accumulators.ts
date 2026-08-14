// R3/STAT-1 · 有界历史 + 在线统计。Numeric 使用 Welford，稳定计算样本标准差。
// 冻结：Series 保留 time=0 初始点；统计 sampleCount 只数成功 Tick，不把初始化点当模拟样本。

import type { BooleanStatistics, NumericStatistics, SeriesPoint } from './types';
import type { RuntimeValue } from '../runtime/types';

export const DEFAULT_SERIES_CAP = 10000;
export const DEFAULT_LOG_CAP = 10000;

export class BoundedSeries {
  private points: SeriesPoint[] = [];

  constructor(private readonly cap: number = DEFAULT_SERIES_CAP) {}

  append(point: SeriesPoint): void {
    this.points.push(point);
    if (this.points.length > this.cap) this.points = this.points.slice(this.points.length - this.cap);
  }

  clear(): void { this.points = []; }

  all(): SeriesPoint[] { return this.points; }
}

export class NumericAccumulator {
  private last: number;
  private minV = Infinity;
  private maxV = -Infinity;
  private mean = 0;
  private m2 = 0;
  private count = 0;

  constructor(private readonly initial: number = 0) { this.last = initial; }

  record(value: number): void {
    this.last = value;
    if (value < this.minV) this.minV = value;
    if (value > this.maxV) this.maxV = value;
    this.count += 1;
    const delta = value - this.mean;
    this.mean += delta / this.count;
    const delta2 = value - this.mean;
    this.m2 += delta * delta2;
  }

  snapshot(): NumericStatistics {
    return {
      kind: 'numeric',
      initial: this.initial,
      current: this.last,
      min: this.count > 0 ? this.minV : this.initial,
      max: this.count > 0 ? this.maxV : this.initial,
      average: this.count > 0 ? this.mean : this.initial,
      delta: this.last - this.initial,
      sampleCount: this.count,
      sampleStdDev: this.count > 1 ? Math.sqrt(this.m2 / (this.count - 1)) : null,
    };
  }
}

export class BooleanAccumulator {
  private last: boolean;
  private changes = 0;

  constructor(private readonly initial: boolean = false) { this.last = initial; }

  record(value: boolean): void {
    if (value !== this.last) this.changes += 1;
    this.last = value;
  }

  snapshot(): BooleanStatistics {
    return { kind: 'boolean', initial: this.initial, current: this.last, changeCount: this.changes };
  }
}

export type WatchValue = RuntimeValue;
