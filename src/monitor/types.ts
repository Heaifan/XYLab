// R3 · Monitoring 公共类型：Watch / Series / Log / Statistics / Session / Snapshot。
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
  source: string; // 'tick' | 'watch:<target>' | eventId | 'session' | 'runtime'
  target?: string;
  message: string;
  previousValue?: RuntimeValue;
  currentValue?: RuntimeValue;
}

export interface WatchRecord {
  target: string;
  mode: WatchMode;
  threshold?: number;
  operator: ComparisonOperator; // Loader 已归一化（threshold 模式缺省 '>='）
  type: VariableType; // 决定统计形态：number/integer → numeric；boolean → boolean；其余仅 series
}

export interface NumericStatistics {
  kind: 'numeric';
  initial: number;
  current: number;
  min: number;
  max: number;
  average: number;
  delta: number; // current - initial
  sampleCount: number;
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
  tickCount: number; // 成功 Tick 数
  lastTime: number;
  lastTickIndex: number;
  failure: { code: string; message: string } | null; // 最近 Runtime Failure
}

export interface MonitorSnapshot {
  watches: WatchRecord[];
  series: Record<string, SeriesPoint[]>;
  logs: MonitorLogEntry[];
  statistics: Record<string, WatchStatistics>;
  session: SessionInfo;
}
