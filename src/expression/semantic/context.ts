// R2-03C/R2-06 · C1 符号表 + C4 函数白名单/签名。
// SemanticContext = variables + builtins + functions（表达式可见内容的唯一语义环境）。
// 克制原则：builtin 当前只有 dt；random 于 R2-06 作为 0 参内置函数进入（值经 EvaluationContext 注入）。

import type { ExperimentDefinition } from '../../protocol/types';
import type { FunctionSignature, SemanticContext, SymbolType, SemanticType } from './types';

export const BUILTINS: ReadonlyMap<string, SemanticType> = new Map([['dt', 'number']]);
// v0.1 仅 dt（当前固定 tick 的模拟时间跨度）。time/tick/tickIndex/random/entity/self
// 等 Runtime 真正需要时再增加，本轮一律不提供。

export const FUNCTIONS: ReadonlyMap<string, FunctionSignature> = new Map([
  ['min', { minArgs: 2, maxArgs: Infinity, paramType: 'number', returnType: 'number' }],
  ['max', { minArgs: 2, maxArgs: Infinity, paramType: 'number', returnType: 'number' }],
  ['clamp', { minArgs: 3, maxArgs: 3, paramType: 'number', returnType: 'number' }],
  ['abs', { minArgs: 1, maxArgs: 1, paramType: 'number', returnType: 'number' }],
  ['floor', { minArgs: 1, maxArgs: 1, paramType: 'number', returnType: 'number' }],
  ['ceil', { minArgs: 1, maxArgs: 1, paramType: 'number', returnType: 'number' }],
  ['round', { minArgs: 1, maxArgs: 1, paramType: 'number', returnType: 'number' }],
  ['sqrt', { minArgs: 1, maxArgs: 1, paramType: 'number', returnType: 'number' }],
  ['pow', { minArgs: 2, maxArgs: 2, paramType: 'number', returnType: 'number' }],
  ['random', { minArgs: 0, maxArgs: 0, paramType: 'number', returnType: 'number' }], // R2-06
]);

export function buildSemanticContext(definition: ExperimentDefinition): SemanticContext {
  const variables = new Map<string, SymbolType>();
  for (const [name, def] of Object.entries(definition.variables)) {
    // number/integer → number；boolean → boolean；string/enum 保留在表内但标记 unsupported，
    // 被引用时由 infer 报 UNSUPPORTED_SYMBOL_TYPE（比 UNKNOWN_IDENTIFIER 更精确）。
    if (def.type === 'number' || def.type === 'integer') variables.set(name, 'number');
    else if (def.type === 'boolean') variables.set(name, 'boolean');
    else variables.set(name, 'unsupported');
  }
  return { variables, builtins: new Map(BUILTINS), functions: new Map(FUNCTIONS) };
}
