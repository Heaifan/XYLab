// R2-01 · Normalize（协议默认值规则）：只补充「协议明文允许」的默认值，绝不猜测语义。
// 覆盖：timeline.totalTicks 计算、watch.operator 默认、event 的 message/level/repeat 默认、
// output/random 结构复制。

import type {
  ComparisonOperator,
  EventDefinition,
  EventLevel,
  OutputDefinition,
  RandomDefinition,
  TimelineDefinition,
  WatchDefinition,
  WatchMode,
} from '../types';
import type { RawExperiment } from '../raw-types';

export interface Defaults {
  timeline: TimelineDefinition;
  watch: WatchDefinition[];
  events: EventDefinition[];
  output?: OutputDefinition;
  random?: RandomDefinition;
}

export function applyDefaults(raw: RawExperiment): Defaults {
  // timeline：totalTicks = duration / tick（协议 §5）
  const t = raw.timeline!;
  const tick = t.tick as number;
  const duration = t.duration as number;
  const totalTicks = Math.round((duration / tick) * 1e9) / 1e9;
  const timeline: TimelineDefinition = { mode: 'fixed_tick', tick, duration, totalTicks };

  // watch：threshold 模式 operator 缺省 '>='（协议 §6）
  const watch: WatchDefinition[] = (raw.watch ?? []).map((w) => {
    const def: WatchDefinition = { target: w.target as string, mode: w.mode as WatchMode };
    if (w.threshold !== undefined) def.threshold = w.threshold as number;
    if (w.mode === 'threshold') def.operator = (w.operator as ComparisonOperator | undefined) ?? '>=';
    return def;
  });

  // events：message=id、level='info'、repeat=false（协议 §7）
  const events: EventDefinition[] = (raw.events ?? []).map((e) => ({
    id: e.id as string,
    when: e.when as string,
    message: (e.message as string | undefined) ?? (e.id as string),
    level: (e.level as EventLevel | undefined) ?? 'info',
    repeat: (e.repeat as boolean | undefined) ?? false,
  }));

  const defaults: Defaults = { timeline, watch, events };

  // output / random：可选，原样结构复制，不发明默认值
  if (raw.output) {
    defaults.output = {
      summary: Array.isArray(raw.output.summary) ? raw.output.summary.map(String) : [],
      charts: Array.isArray(raw.output.charts)
        ? (raw.output.charts as Array<{ x: unknown; y: unknown }>).map((c) => ({ x: String(c.x), y: String(c.y) }))
        : [],
    };
  }
  if (raw.random) defaults.random = { seed: raw.random.seed as number };

  return defaults;
}
