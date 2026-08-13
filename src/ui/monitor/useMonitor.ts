// FE-A-R1 · 监控桥投影器：100ms 轮询 session.snapshot() + Controller 即时控制状态（纯投影）。
// 冻结：Monitoring Core 是监控数据唯一权威——Watch/Series/Log/Statistics 全部来自 MonitorSnapshot；
// 本 Hook 绝不通过 RuntimeState 前后 diff 重建历史，也不产生任何日志（UI diff log 已废除）。
import { useEffect, useState } from 'react';
import type { MonitorSnapshot } from '../../monitor/types';
import type { createMonitoredRuntime } from '../../monitor/session';

export type MonitoredRuntime = ReturnType<typeof createMonitoredRuntime>;

export interface MonitorBridge {
  snap: MonitorSnapshot | null; // R3 权威快照（watches/series/logs/statistics/session）
  time: number; // 以下四项 = Controller 即时控制状态（按钮/状态显示用，非监控数据）
  tickIndex: number;
  status: string;
  lastError: string | null;
}

const EMPTY: MonitorBridge = { snap: null, time: 0, tickIndex: 0, status: '—', lastError: null };

export function readBridge(runtime: MonitoredRuntime | null): MonitorBridge {
  if (!runtime) return EMPTY;
  const s = runtime.controller.state;
  return {
    snap: runtime.session.snapshot(),
    time: s.time,
    tickIndex: s.tickIndex,
    status: s.status,
    lastError: s.lastError ? `${s.lastError.code}${s.lastError.causeCode ? ` (${s.lastError.causeCode})` : ''}` : null,
  };
}

export function useMonitor(runtime: MonitoredRuntime | null): MonitorBridge {
  const [bridge, setBridge] = useState<MonitorBridge>(() => readBridge(runtime));

  useEffect(() => {
    setBridge(readBridge(runtime)); // 加载/重建：立即重置投影基线
    if (!runtime) return;
    const timer = setInterval(() => setBridge(readBridge(runtime)), 100);
    return () => clearInterval(timer);
  }, [runtime]);

  return bridge;
}
