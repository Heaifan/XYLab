// UI-F1 · 监控轮询 Hook：纯投影（不修改模拟核心）。
// 每 100ms 读 controller.state，与上次快照做 UI 层 diff（tickIndex 变化 / 变量值变化 / 状态变化），
// 生成最近 change 与日志行。Run Loop 不对外发事件，UI 以轮询投影为 v0.1 合同。
import { useEffect, useRef, useState } from 'react';
import type { Controller } from '../../runtime/controller/controller';
import type { RuntimeValue } from '../../runtime/types';

export interface LogLine {
  id: number;
  text: string;
  level: 'info' | 'notice' | 'warning' | 'critical';
}

export interface MonitorSnapshot {
  time: number;
  tickIndex: number;
  status: string;
  values: Record<string, RuntimeValue>;
  changes: Array<{ target: string; previousValue: RuntimeValue; currentValue: RuntimeValue }>;
  log: LogLine[];
  lastError: string | null;
}

const MAX_LOG = 200;

export function useMonitor(controller: Controller | null): MonitorSnapshot {
  const [snap, setSnap] = useState<MonitorSnapshot>({ time: 0, tickIndex: 0, status: '—', values: {}, changes: [], log: [], lastError: null });
  const prevRef = useRef<{ values: Record<string, RuntimeValue>; tickIndex: number; status: string } | null>(null);
  const logRef = useRef<LogLine[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!controller) return;
    const timer = setInterval(() => {
      const s = controller.state;
      const prev = prevRef.current;
      const values = { ...s.variables };
      if (prev) {
        const changes: MonitorSnapshot['changes'] = [];
        for (const [k, v] of Object.entries(values)) {
          if (prev.values[k] !== v) changes.push({ target: k, previousValue: prev.values[k], currentValue: v });
        }
        if (s.tickIndex !== prev.tickIndex || changes.length > 0) {
          for (const c of changes) {
            logRef.current.push({ id: ++idRef.current, text: `[t=${s.time}] ${c.target} ${String(c.previousValue)} → ${String(c.currentValue)}`, level: 'info' });
          }
        }
        if (s.status !== prev.status) {
          logRef.current.push({ id: ++idRef.current, text: `状态 → ${s.status}`, level: s.status === 'failed' ? 'critical' : 'notice' });
        }
        if (logRef.current.length > MAX_LOG) logRef.current = logRef.current.slice(-MAX_LOG);
      }
      prevRef.current = { values, tickIndex: s.tickIndex, status: s.status };
      setSnap({
        time: s.time,
        tickIndex: s.tickIndex,
        status: s.status,
        values,
        changes: prev ? [] : [],
        log: [...logRef.current],
        lastError: s.lastError ? `${s.lastError.code}${s.lastError.causeCode ? ` (${s.lastError.causeCode})` : ''}` : null,
      });
    }, 100);
    return () => clearInterval(timer);
  }, [controller]);

  return snap;
}
