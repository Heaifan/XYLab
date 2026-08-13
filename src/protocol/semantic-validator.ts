// R2-01 · 语义校验层：Schema 管结构，这里管「引用与含义」。
// 原则：非法实验 → 明确 FAIL，绝不静默纠错（公式测试最怕静默纠错）。
// 边界：公式表达式内部的标识符引用、事件 when 的引用需要表达式解析器（R2-03），本层不解析表达式。

import type { LoadError, RawExperiment } from './types';

const RESERVED = new Set(['time', 'dt']);
const EPS = 1e9; // duration/tick 整数化精度

function err(code: LoadError['code'], message: string, path: string): LoadError {
  return { code, message, path };
}

// 解析目标引用：变量名 → 'variable'；entityId.stateKey → 'entity'；否则 null。
// 变量名不含点号、实体 id 不含点号（Schema 已保证），首个点号分割无歧义。
function resolveTarget(raw: RawExperiment, target: string): 'variable' | 'entity' | null {
  const dot = target.indexOf('.');
  if (dot === -1) {
    const vars = raw.variables ?? {};
    return Object.prototype.hasOwnProperty.call(vars, target) ? 'variable' : null;
  }
  const id = target.slice(0, dot);
  const key = target.slice(dot + 1);
  const entity = (raw.entities ?? []).find((e) => e.id === id);
  if (!entity || !entity.state || !Object.prototype.hasOwnProperty.call(entity.state, key)) return null;
  return 'entity';
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
      err(
        'INVALID_TIMELINE_RANGE',
        `duration(${duration}) / tick(${tick}) = ${ticks}，必须为 ≥1 的整数 tick 数`,
        '/timeline',
      ),
    );
  }
}

function checkVariables(raw: RawExperiment, errors: LoadError[]): void {
  const vars = raw.variables ?? {};
  for (const [name, def] of Object.entries(vars)) {
    const base = `/variables/${name}`;
    if (RESERVED.has(name)) {
      errors.push(err('RESERVED_NAME', `变量名 '${name}' 是保留字（time/dt）`, base));
    }
    const v = def.value;
    switch (def.type) {
      case 'number':
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 类型 number，value 必须是有限数值`, `${base}/value`));
        }
        break;
      case 'integer':
        if (typeof v !== 'number' || !Number.isInteger(v)) {
          errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 类型 integer，value 必须是整数`, `${base}/value`));
        }
        break;
      case 'boolean':
        if (typeof v !== 'boolean') {
          errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 类型 boolean，value 必须是 true/false`, `${base}/value`));
        }
        break;
      case 'string':
        if (typeof v !== 'string') {
          errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 类型 string，value 必须是字符串`, `${base}/value`));
        }
        break;
      case 'enum': {
        const options = (def.options ?? []) as unknown[];
        if (!options.some((o) => o === v)) {
          errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 的 value 不在 options 内`, `${base}/value`));
        }
        break;
      }
      default:
        break; // type 合法性由 Schema 层保证
    }
    const hasNumeric = def.min !== undefined || def.max !== undefined || def.step !== undefined;
    if (hasNumeric && def.type !== 'number' && def.type !== 'integer') {
      errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 的 min/max/step 仅适用于 number/integer 类型`, base));
    }
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

export function validateSemantics(raw: RawExperiment): LoadError[] {
  const errors: LoadError[] = [];
  checkVariables(raw, errors);
  checkEntities(raw, errors);
  checkFormulas(raw, errors);
  checkWatch(raw, errors);
  checkOutput(raw, errors);
  checkTimeline(raw, errors);
  return errors;
}
