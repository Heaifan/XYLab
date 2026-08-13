// R3 · Protocol Event 编译与边缘触发求值（复用现有 Expression Engine 全管线）。
// 冻结：false→true 边缘触发；条件持续 true 不重复；回到 false 重武装可再次触发；
// 事件条件禁 random()（不注入 PRNG——监控绝不消费随机序列，保证确定性）。
// repeat 字段 R3 不产生行为差异（一律边缘触发），once/cooldown/every_tick 属未来协议扩展。

import { tokenizeExpression } from '../expression/tokenizer';
import { parseExpression } from '../expression/syntax/parser';
import { buildSemanticContext } from '../expression/semantic/context';
import { inferType } from '../expression/semantic/infer';
import { evaluate } from '../expression/evaluation/evaluator';
import type { EvaluationContext } from '../expression/evaluation/types';
import type { ExpressionNode } from '../expression/syntax/ast';
import type { ComparisonOperator, EventLevel, ExperimentDefinition } from '../protocol/types';
import type { RuntimeValue } from '../runtime/types';
import type { WatchRecord } from './types';
import type { RegistryWarning } from './registry';

export interface CompiledEvent {
  id: string;
  message: string;
  level: EventLevel;
  ast: ExpressionNode | null; // null = 编译失败（禁用）
  wasTrue: boolean;
}

export interface FiredEvent { id: string; message: string; level: EventLevel; }

export function compileEvents(definition: ExperimentDefinition): { events: CompiledEvent[]; warnings: RegistryWarning[] } {
  const ctx = buildSemanticContext(definition);
  const warnings: RegistryWarning[] = [];
  const events: CompiledEvent[] = definition.events.map((e) => {
    try {
      const ast = parseExpression(tokenizeExpression(e.when));
      const t = inferType(ast, ctx);
      if (t !== 'boolean') throw new Error(`条件 '${e.when}' 结果类型为 ${t}，要求 boolean`);
      return { id: e.id, message: e.message, level: e.level, ast, wasTrue: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push({ target: e.id, message: `事件 '${e.id}' 条件无效（${msg}），已禁用` });
      return { id: e.id, message: e.message, level: e.level, ast: null, wasTrue: false };
    }
  });
  return { events, warnings };
}

export function evaluateEvents(events: CompiledEvent[], values: Record<string, RuntimeValue>, dt: number): FiredEvent[] {
  const ctxVars: Record<string, number | boolean> = {};
  for (const [k, v] of Object.entries(values)) {
    if (typeof v === 'number' || typeof v === 'boolean') ctxVars[k] = v;
  }
  const ctx: EvaluationContext = { variables: ctxVars, builtins: { dt } }; // 无 random：事件条件不得消费 PRNG
  const fired: FiredEvent[] = [];
  for (const e of events) {
    if (!e.ast) continue; // 编译失败：永久禁用
    let value: unknown;
    try {
      value = evaluate(e.ast, ctx);
    } catch {
      continue; // 求值失败：跳过本 tick（语义已在编译期把关）
    }
    const isTrue = value === true; // 严格布尔，无 truthy 转换
    if (isTrue && !e.wasTrue) fired.push({ id: e.id, message: e.message, level: e.level });
    e.wasTrue = isTrue; // true→true 不重复；false 重武装
  }
  return fired;
}

// threshold watch 触发：与 protocol event 同一套 false→true 边缘触发语义（level 固定 warning）。
export interface CompiledThreshold {
  target: string;
  threshold: number;
  operator: ComparisonOperator;
  wasTrue: boolean;
}

export function compileThresholds(watches: WatchRecord[]): CompiledThreshold[] {
  return watches.filter((w) => w.mode === 'threshold' && w.threshold !== undefined).map((w) => ({ target: w.target, threshold: w.threshold as number, operator: w.operator, wasTrue: false }));
}

export function evaluateThresholds(ts: CompiledThreshold[], values: Record<string, RuntimeValue>): FiredEvent[] {
  const fired: FiredEvent[] = [];
  for (const t of ts) {
    const v = values[t.target];
    if (typeof v !== 'number') continue; // 非数值不参与阈值比较
    const isTrue = compare(v, t.operator, t.threshold);
    if (isTrue && !t.wasTrue) fired.push({ id: `watch:${t.target}`, message: `${t.target} ${v} ${t.operator} ${t.threshold}（阈值触发）`, level: 'warning' });
    t.wasTrue = isTrue;
  }
  return fired;
}

function compare(a: number, op: ComparisonOperator, b: number): boolean {
  if (op === '>=') return a >= b;
  if (op === '>') return a > b;
  if (op === '<=') return a <= b;
  if (op === '<') return a < b;
  if (op === '==') return a === b;
  return a !== b;
}
