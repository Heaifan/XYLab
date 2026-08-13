// R4-F1 · 监控轮询 Hook：纯投影（不修改模拟核心）。
// 100ms 轮询 controller.state，与上次快照做 UI 层 diff（tickIndex/变量值/状态变化）生成日志行。
// 控制器切换（加载/重建）时重置快照基线并记一条初始化日志。
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
  log: LogLine[];
  lastError: string | null;
}

const MAX_LOG = 200;

export function useMonitor(controller: Controller | null): MonitorSnapshot {
  const [snap, setSnap] = useState<MonitorSnapshot>({ time: 0, tickIndex: 0, status: '—', values: {}, log: [], lastError: null });
  const prevRef = useRef<{ values: Record<string, RuntimeValue>; tickIndex: number; status: string } | null>(null);
  const logRef = useRef<LogLine[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    prevRef.current = null;
    logRef.current = [];
    if (controller) {
      logRef.current.push({ id: ++idRef.current, text: `已初始化「${controller.definition.experiment.name}」· ready`, level: 'notice' });
      setSnap({ time: 0, tickIndex: 0, status: 'ready', values: { ...controller.state.variables }, log: [...logRef.current], lastError: null });
    } else {
      setSnap({ time: 0, tickIndex: 0, status: '—', values: {}, log: [], lastError: null });
    }
  }, [controller]);

  useEffect(() => {
    if (!controller) return;
    const timer = setInterval(() => {
      const s = controller.state;
      const prev = prevRef.current;
      const values = { ...s.variables };
      if (prev) {
        if (s.tickIndex !== prev.tickIndex || Object.keys(values).some((k) => prev.values[k] !== values[k])) {
          for (const [k, v] of Object.entries(values)) {
            if (prev.values[k] !== v) {
              logRef.current.push({ id: ++idRef.current, text: `[t=${s.time}] ${k} ${String(prev.values[k])} → ${String(v)}`, level: 'info' });
            }
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
        log: [...logRef.current],
        lastError: s.lastError ? `${s.lastError.code}${s.lastError.causeCode ? ` (${s.lastError.causeCode})` : ''}` : null,
      });
    }, 100);
    return () => clearInterval(timer);
  }, [controller]);

  return snap;
}
