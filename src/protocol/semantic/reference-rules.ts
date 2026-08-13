// R2-01 · 语义规则（引用域）：实体唯一性、公式/watch 目标、output 引用、时间线范围。

import type { LoadError } from '../loader-types';
import type { RawExperiment } from '../raw-types';
import { resolveTarget } from './resolve-target';

const EPS = 1e9; // duration/tick 整数化精度

function err(code: LoadError['code'], message: string, path: string): LoadError {
  return { code, message, path };
}

function checkTimeline(raw: RawExperiment, errors: LoadError[]): void {
  const t = raw.timeline;
  if (!t) return; // 缺失由 Schema 层负责
  const tick = t.tick as number;
  const duration = t.duration as number;
  if (typeof tick !== 'number' || typeof duration !== 'number') return;
  const ticks = Math.round((duration / tick) * EPS) / EPS;
  if (!Number.isInteger(ticks) || ticks < 1) {
    errors.push(
      err('INVALID_TIMELINE_RANGE', `duration(${duration}) / tick(${tick}) = ${ticks}，必须为 ≥1 的整数 tick 数`, '/timeline'),
    );
  }
}

function checkEntities(raw: RawExperiment, errors: LoadError[]): void {
  const seen = new Set<string>();
  (raw.entities ?? []).forEach((e, i) => {
    const id = e.id as string;
    if (seen.has(id)) {
      errors.push(err('DUPLICATE_ENTITY_ID', `实体 id '${id}' 重复`, `/entities/${i}/id`));
    }
    seen.add(id);
  });
}

function checkFormulas(raw: RawExperiment, errors: LoadError[]): void {
  (raw.formulas ?? []).forEach((f, i) => {
    const target = f.target as string;
    if (!resolveTarget(raw, target)) {
      errors.push(err('FORMULA_TARGET_NOT_FOUND', `公式 target '${target}' 不是已知变量或实体路径`, `/formulas/${i}/target`));
    }
  });
}

function checkWatch(raw: RawExperiment, errors: LoadError[]): void {
  (raw.watch ?? []).forEach((w, i) => {
    const target = w.target as string;
    if (!resolveTarget(raw, target)) {
      errors.push(err('WATCH_TARGET_NOT_FOUND', `watch target '${target}' 不是已知变量或实体路径`, `/watch/${i}/target`));
    }
  });
}

function checkOutput(raw: RawExperiment, errors: LoadError[]): void {
  const output = raw.output;
  if (!output) return;
  const summary = Array.isArray(output.summary) ? (output.summary as unknown[]) : [];
  summary.forEach((s, i) => {
    if (!resolveTarget(raw, String(s))) {
      errors.push(err('UNKNOWN_VARIABLE_REFERENCE', `output.summary 引用 '${String(s)}' 不存在`, `/output/summary/${i}`));
    }
  });
  const charts = Array.isArray(output.charts) ? (output.charts as Array<{ x?: unknown; y?: unknown }>) : [];
  charts.forEach((c, i) => {
    if (c.x !== 'time') {
      errors.push(err('UNKNOWN_VARIABLE_REFERENCE', `chart x 必须是 'time'（得到 '${String(c.x)}'）`, `/output/charts/${i}/x`));
    }
    if (typeof c.y === 'string' && !resolveTarget(raw, c.y)) {
      errors.push(err('UNKNOWN_VARIABLE_REFERENCE', `chart y 引用 '${c.y}' 不存在`, `/output/charts/${i}/y`));
    }
  });
}

export function checkReferences(raw: RawExperiment, errors: LoadError[]): void {
  checkTimeline(raw, errors);
  checkEntities(raw, errors);
  checkFormulas(raw, errors);
  checkWatch(raw, errors);
  checkOutput(raw, errors);
}
