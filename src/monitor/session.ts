// R3/STAT-1 · Monitoring Session：Observer Only；Series 含初始化点，Statistics 只统计成功 Tick。
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
  const seriesCap = options.seriesCap ?? DEFAULT_SERIES_CAP, logCap = options.logCap ?? DEFAULT_LOG_CAP;
  const { watches, warnings } = buildWatchRegistry(definition);
  const { events, warnings: eventWarnings } = compileEvents(definition);
  const observed = new Set(watches.map((w) => w.target)), thresholds = compileThresholds(watches);
  const seriesMap = new Map<string, BoundedSeries>();
  const statsMap = new Map<string, NumericAccumulator | BooleanAccumulator>();
  let logs: MonitorLogEntry[] = [], idSeq = 0, tickCount = 0, lastTime = 0, lastTickIndex = 0;
  let failure: { code: string; message: string } | null = null;

  function pushLog(d: { level: EventLevel; kind: LogKind; source: string; target?: string; message: string; previousValue?: RuntimeValue; currentValue?: RuntimeValue }): void {
    logs.push({ id: ++idSeq, time: lastTime, tickIndex: lastTickIndex, ...d });
    if (logs.length > logCap) logs = logs.slice(-logCap);
  }

  function initialValue(w: WatchRecord): RuntimeValue {
    return definition.variables[w.target].value;
  }

  function recordTick(w: WatchRecord, time: number, tickIndex: number, value: RuntimeValue): void {
    seriesMap.get(w.target)!.append({ time, tickIndex, value });
    const acc = statsMap.get(w.target);
    if (acc instanceof NumericAccumulator && typeof value === 'number') acc.record(value);
    else if (acc instanceof BooleanAccumulator && typeof value === 'boolean') acc.record(value);
  }

  function initSession(): void {
    for (const w of watches) {
      const initial = initialValue(w);
      const series = new BoundedSeries(seriesCap);
      series.append({ time: 0, tickIndex: 0, value: initial });
      seriesMap.set(w.target, series);
      if ((w.type === 'number' || w.type === 'integer') && typeof initial === 'number') statsMap.set(w.target, new NumericAccumulator(initial));
      else if (w.type === 'boolean' && typeof initial === 'boolean') statsMap.set(w.target, new BooleanAccumulator(initial));
    }
    for (const warn of [...warnings, ...eventWarnings]) {
      pushLog({ level: 'warning', kind: 'runtime', source: 'session', target: warn.target, message: warn.message });
    }
  }

  initSession();

  function observe(o: TickObservation): void {
    lastTime = o.time; lastTickIndex = o.tickIndex;
    if (o.status === 'failed') {
      failure = { code: o.error!.code, message: o.error!.message };
      pushLog({ level: 'critical', kind: 'runtime', source: 'runtime', message: `Tick 失败 [${o.error!.code}] ${o.error!.message}` });
      return;
    }
    if (o.status === 'completed' && o.result === null) return;
    tickCount += 1;
    for (const c of o.result?.changes ?? []) {
      if (observed.has(c.target)) pushLog({ level: 'trace', kind: 'change', source: 'tick', target: c.target, message: `${c.target} ${String(c.previousValue)} → ${String(c.currentValue)}`, previousValue: c.previousValue, currentValue: c.currentValue });
    }
    for (const w of watches) recordTick(w, o.time, o.tickIndex, o.values[w.target]);
    for (const f of evaluateEvents(events, o.values, definition.timeline.tick)) pushLog({ level: f.level, kind: 'event', source: f.id, message: f.message });
    for (const f of evaluateThresholds(thresholds, o.values)) pushLog({ level: f.level, kind: 'event', source: f.id, message: f.message });
  }

  function snapshot(): MonitorSnapshot {
    const series: Record<string, SeriesPoint[]> = {}, statistics: Record<string, WatchStatistics> = {};
    for (const w of watches) series[w.target] = seriesMap.get(w.target)!.all();
    for (const [target, acc] of statsMap) statistics[target] = acc.snapshot();
    return { watches, series, logs: [...logs], statistics, session: { experimentId: definition.experiment.id, tickCount, lastTime, lastTickIndex, failure } };
  }

  function reset(): void {
    logs = []; idSeq = 0; tickCount = 0; lastTime = 0; lastTickIndex = 0; failure = null;
    seriesMap.clear(); statsMap.clear();
    for (const e of events) e.wasTrue = false;
    for (const t of thresholds) t.wasTrue = false;
    initSession();
  }
  return { observe, snapshot, reset };
}

export function createMonitoredRuntime(definition: ExperimentDefinition, scheduler?: Scheduler): { controller: Controller; session: MonitorSession; reset(): void } {
  const session = createMonitorSession(definition);
  const controller = createController(definition, { scheduler, observer: (o) => session.observe(o) });
  return { controller, session, reset() { controller.reset(); session.reset(); } };
}
