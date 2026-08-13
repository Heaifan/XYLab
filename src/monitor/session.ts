// R3 · Monitoring Session：观察者核心 + 生命周期 + 统一快照（Observer Only，绝不回写 Runtime）。
// 生命周期：Load/重建 → 新 session；Pause/Resume/Stop/Completed/Failed 保留证据；Reset = Runtime+Session 一起重建。
import { createController } from '../runtime/controller/controller';
import type { Controller } from '../runtime/controller/controller';
import type { TickObservation } from '../runtime/controller/types';
import type { Scheduler } from '../runtime/controller/loop';
import type { EventLevel, ExperimentDefinition } from '../protocol/types';
import type { RuntimeValue } from '../runtime/types';
import { BoundedSeries, BooleanAccumulator, DEFAULT_LOG_CAP, DEFAULT_SERIES_CAP, NumericAccumulator } from './accumulators';
import { compileEvents, compileThresholds, evaluateEvents, evaluateThresholds } from './events';
import { buildWatchRegistry } from './registry';
import type { LogKind, MonitorLogEntry, MonitorSnapshot, SeriesPoint, WatchRecord, WatchStatistics } from './types';

export interface MonitorOptions { seriesCap?: number; logCap?: number; }

export interface MonitorSession { observe(observation: TickObservation): void; snapshot(): MonitorSnapshot; reset(): void; }

export function createMonitorSession(definition: ExperimentDefinition, options: MonitorOptions = {}): MonitorSession {
  const seriesCap = options.seriesCap ?? DEFAULT_SERIES_CAP;
  const logCap = options.logCap ?? DEFAULT_LOG_CAP;
  const { watches, warnings } = buildWatchRegistry(definition);
  const { events, warnings: eventWarnings } = compileEvents(definition);
  const observed = new Set(watches.map((w) => w.target));
  const thresholds = compileThresholds(watches);
  const seriesMap = new Map<string, BoundedSeries>();
  const statsMap = new Map<string, NumericAccumulator | BooleanAccumulator>();
  let logs: MonitorLogEntry[] = [];
  let idSeq = 0;
  let tickCount = 0;
  let lastTime = 0;
  let lastTickIndex = 0;
  let failure: { code: string; message: string } | null = null;
  function pushLog(d: { level: EventLevel; kind: LogKind; source: string; target?: string; message: string; previousValue?: RuntimeValue; currentValue?: RuntimeValue }): void {
    logs.push({ id: ++idSeq, time: lastTime, tickIndex: lastTickIndex, ...d }); if (logs.length > logCap) logs = logs.slice(-logCap);
  }

  function recordPoint(w: WatchRecord, time: number, tickIndex: number, value: RuntimeValue): void {
    seriesMap.get(w.target)!.append({ time, tickIndex, value });
    const acc = statsMap.get(w.target);
    if (acc instanceof NumericAccumulator && typeof value === 'number') acc.record(value);
    else if (acc instanceof BooleanAccumulator && typeof value === 'boolean') acc.record(value);
  }

  function initSession(): void {
    for (const w of watches) {
      seriesMap.set(w.target, new BoundedSeries(seriesCap));
      if (w.type === 'number' || w.type === 'integer') statsMap.set(w.target, new NumericAccumulator());
      else if (w.type === 'boolean') statsMap.set(w.target, new BooleanAccumulator());
      recordPoint(w, 0, 0, definition.variables[w.target].value); // time=0 初始点
    }
    for (const warn of [...warnings, ...eventWarnings]) pushLog({ level: 'warning', kind: 'runtime', source: 'session', target: warn.target, message: warn.message });
  }
  initSession();
  function observe(o: TickObservation): void {
    lastTime = o.time;
    lastTickIndex = o.tickIndex;
    if (o.status === 'failed') {
      failure = { code: o.error!.code, message: o.error!.message };
      pushLog({ level: 'critical', kind: 'runtime', source: 'runtime', message: `Tick 失败 [${o.error!.code}] ${o.error!.message}` });
      return; // 保留失败前全部数据
    }
    if (o.status === 'completed' && o.result === null) return; // duration-reached：无新数据
    tickCount += 1;
    for (const c of o.result?.changes ?? []) {
      if (!observed.has(c.target)) continue;
      pushLog({ level: 'trace', kind: 'change', source: 'tick', target: c.target, message: `${c.target} ${String(c.previousValue)} → ${String(c.currentValue)}`, previousValue: c.previousValue, currentValue: c.currentValue });
    }
    for (const w of watches) recordPoint(w, o.time, o.tickIndex, o.values[w.target]);
    for (const f of evaluateEvents(events, o.values, definition.timeline.tick)) pushLog({ level: f.level, kind: 'event', source: f.id, message: f.message });
    for (const f of evaluateThresholds(thresholds, o.values)) pushLog({ level: f.level, kind: 'event', source: f.id, message: f.message });
  }

  function snapshot(): MonitorSnapshot {
    const series: Record<string, SeriesPoint[]> = {};
    for (const w of watches) series[w.target] = seriesMap.get(w.target)!.all();
    const statistics: Record<string, WatchStatistics> = {};
    for (const [target, acc] of statsMap) statistics[target] = acc.snapshot();
    return { watches, series, logs: [...logs], statistics, session: { experimentId: definition.experiment.id, tickCount, lastTime, lastTickIndex, failure } };
  }

  function reset(): void {
    logs = [];
    idSeq = 0;
    tickCount = 0;
    lastTime = 0;
    lastTickIndex = 0;
    failure = null;
    seriesMap.clear();
    statsMap.clear();
    for (const e of events) e.wasTrue = false; for (const t of thresholds) t.wasTrue = false; // edge-state 清空
    initSession(); // 重新记录 time=0 初始值
  }

  return { observe, snapshot, reset };
}
export function createMonitoredRuntime(definition: ExperimentDefinition, scheduler?: Scheduler): { controller: Controller; session: MonitorSession; reset(): void } {
  const session = createMonitorSession(definition);
  const controller = createController(definition, { scheduler, observer: (o) => session.observe(o) });
  return { controller, session, reset() { controller.reset(); session.reset(); } };
}
