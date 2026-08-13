// R2-03D 测试共享工具（非 test 文件）。
import { expect } from 'vitest';
import { tokenizeExpression } from '../../../src/expression/tokenizer';
import { parseExpression } from '../../../src/expression/syntax/parser';
import { validateExpression } from '../../../src/expression/semantic/validator';
import { evaluate } from '../../../src/expression/evaluation/evaluator';
import { ExpressionEvaluationError } from '../../../src/expression/evaluation/errors';
import type { EvalValue, EvaluationContext } from '../../../src/expression/evaluation/types';
import type { ExperimentDefinition, VariableType } from '../../../src/protocol/types';

export function makeDefinition(vars: Record<string, VariableType>): ExperimentDefinition {
  const variables: ExperimentDefinition['variables'] = {};
  for (const [name, type] of Object.entries(vars)) {
    const value = type === 'boolean' ? false : 0;
    variables[name] = { name, type, value, label: name };
  }
  return {
    schemaVersion: 'xylab-experiment@0.1',
    experiment: { id: 't-eval', name: 'T' },
    variables,
    entities: [],
    formulas: [],
    timeline: { mode: 'fixed_tick', tick: 1, duration: 10, totalTicks: 10 },
    watch: [],
    events: [],
  };
}

// 完整管线：tokenize → parse → semantic validate → evaluate（值只进 context，不进定义）
export function evalExpr(
  src: string,
  vars: Record<string, VariableType> = {},
  values: Record<string, EvalValue> = {},
  builtins: Record<string, EvalValue> = {},
): EvalValue {
  const def = makeDefinition(vars);
  const ast = parseExpression(tokenizeExpression(src));
  const validated = validateExpression(ast, def);
  const ctx: EvaluationContext = { variables: values, builtins };
  return evaluate(validated.ast, ctx);
}

export function expectEvalError(
  src: string,
  vars: Record<string, VariableType>,
  values: Record<string, EvalValue>,
  code: ExpressionEvaluationError['code'],
): void {
  try {
    evalExpr(src, vars, values);
    throw new Error(`预期求值错误但成功: ${JSON.stringify(src)}`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('预期求值错误但成功')) throw e;
    expect(e).toBeInstanceOf(ExpressionEvaluationError);
    expect((e as ExpressionEvaluationError).code).toBe(code);
  }
}
