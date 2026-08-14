// R3/STAT-1 · Monitoring 公共类型：Watch / Series / Log / Statistics / Session / Snapshot。
// R4-F2 UI 只消费 MonitorSnapshot 一种结构，禁止翻 Runtime 历史。

import type { ComparisonOperator, EventLevel, VariableType, WatchMode } from '../protocol/types';
import type { RuntimeValue } from '../runtime/types';

export interface SeriesPoint {
  time: number;
  tickIndex: number;
  value: RuntimeValue;
}

export type LogKind = 'change' | 'event' | 'runtime';

export interface MonitorLogEntry {
  id: number;
  time: number;
  tickIndex: number;
  level: EventLevel;
  kind: LogKind;
  source: string;
  target?: string;
  message: string;
  previousValue?: RuntimeValue;
  currentValue?: RuntimeValue;
}

export interface WatchRecord {
  target: string;
  mode: WatchMode;
  threshold?: number;
  operator: ComparisonOperator;
  type: VariableType;
}

export interface NumericStatistics {
  kind: 'numeric';
  initial: number;
  current: number;
  min: number;
  max: number;
  average: number;
  delta: number;
  sampleCount: number; // 成功 Tick 样本数；不含 time=0 初始化点
  sampleStdDev: number | null; // 样本标准差，N-1；N<2 时为 null
}

export interface BooleanStatistics {
  kind: 'boolean';
  initial: boolean;
  current: boolean;
  changeCount: number;
}

export type WatchStatistics = NumericStatistics | BooleanStatistics;

export interface SessionInfo {
  experimentId: string;
  tickCount: number;
  lastTime: number;
  lastTickIndex: number;
  failure: { code: string; message: string } | null;
}

export interface MonitorSnapshot {
  watches: WatchRecord[];
  series: Record<string, SeriesPoint[]>;
  logs: MonitorLogEntry[];
  statistics: Record<string, WatchStatistics>;
  session: SessionInfo;
}
