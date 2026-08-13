// R2-03C 测试共享工具（非 test 文件）。
import { expect } from 'vitest';
import { tokenizeExpression } from '../../../src/expression/tokenizer';
import { parseExpression } from '../../../src/expression/syntax/parser';
import { validateExpression, validateFormula } from '../../../src/expression/semantic/validator';
import { ExpressionSemanticError } from '../../../src/expression/semantic/errors';
import type { ExperimentDefinition, VariableType } from '../../../src/protocol/types';
import type { ValidatedExpression } from '../../../src/expression/semantic/types';

export function makeDefinition(vars: Record<string, VariableType>): ExperimentDefinition {
  const variables: ExperimentDefinition['variables'] = {};
  for (const [name, type] of Object.entries(vars)) {
    const value = type === 'boolean' ? false : type === 'string' ? 's' : type === 'enum' ? 's' : 0;
    variables[name] = { name, type, value, label: name, ...(type === 'enum' ? { options: ['s'] } : {}) };
  }
  return {
    schemaVersion: 'xylab-experiment@0.1',
    experiment: { id: 't-sem', name: 'T' },
    variables,
    entities: [],
    formulas: [],
    timeline: { mode: 'fixed_tick', tick: 1, duration: 10, totalTicks: 10 },
    watch: [],
    events: [],
  };
}

export function check(src: string, vars: Record<string, VariableType> = {}): ValidatedExpression {
  return validateExpression(parseExpression(tokenizeExpression(src)), makeDefinition(vars));
}

export function checkFormula(expression: string, target: string, vars: Record<string, VariableType>): ValidatedExpression {
  return validateFormula({ id: 'f1', target, expression }, makeDefinition(vars));
}

export function expectSemanticError(
  src: string,
  vars: Record<string, VariableType>,
  code: ExpressionSemanticError['code'],
  identifier?: string,
): void {
  try {
    check(src, vars);
    throw new Error(`预期语义错误但成功: ${JSON.stringify(src)}`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('预期语义错误但成功')) throw e;
    expect(e).toBeInstanceOf(ExpressionSemanticError);
    const se = e as ExpressionSemanticError;
    expect(se.code).toBe(code);
    if (identifier !== undefined) expect(se.identifier).toBe(identifier);
  }
}

export function expectFormulaError(
  expression: string,
  target: string,
  vars: Record<string, VariableType>,
  code: ExpressionSemanticError['code'],
): void {
  try {
    checkFormula(expression, target, vars);
    throw new Error(`预期语义错误但成功: ${JSON.stringify(expression)}`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('预期语义错误但成功')) throw e;
    expect(e).toBeInstanceOf(ExpressionSemanticError);
    expect((e as ExpressionSemanticError).code).toBe(code);
  }
}
