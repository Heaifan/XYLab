// R2-03D Evaluator 测试（运行期安全边界）：D12~D13、D31~D35。
import { describe, expect, it } from 'vitest';
import { tokenizeExpression } from '../../../src/expression/tokenizer';
import { parseExpression } from '../../../src/expression/syntax/parser';
import { validateExpression } from '../../../src/expression/semantic/validator';
import { evaluate } from '../../../src/expression/evaluation/evaluator';
import { ExpressionEvaluationError } from '../../../src/expression/evaluation/errors';
import { expectEvalError, evalExpr, makeDefinition } from './helpers';

describe('R2-03D Evaluator · 运行期安全', () => {
  it('D12 除零 → DIVISION_BY_ZERO（span 指向除式）', () => {
    try {
      evalExpr('1 / hp', { hp: 'number' }, { hp: 0 });
      throw new Error('预期求值错误但成功');
    } catch (e) {
      if (e instanceof Error && e.message === '预期求值错误但成功') throw e;
      const re = e as ExpressionEvaluationError;
      expect(re.code).toBe('DIVISION_BY_ZERO');
      expect(re.span).toEqual({ start: 0, end: 6 }); // '1 / hp'
    }
  });

  it('D13 模零 → MODULO_BY_ZERO', () => {
    expectEvalError('10 % hp', { hp: 'number' }, { hp: 0 }, 'MODULO_BY_ZERO');
  });

  it('D31 运行时缺值 → MISSING_RUNTIME_VALUE', () => {
    expectEvalError('fatigue', { fatigue: 'number' }, {}, 'MISSING_RUNTIME_VALUE');
  });

  it('D32 运行时类型不匹配 → RUNTIME_TYPE_MISMATCH', () => {
    expectEvalError('-fatigue', { fatigue: 'number' }, { fatigue: true }, 'RUNTIME_TYPE_MISMATCH');
  });

  it('D33 非有限结果拒绝 → NON_FINITE_RESULT', () => {
    expectEvalError('pow(10, 400)', {}, {}, 'NON_FINITE_RESULT');
  });

  it('D34 context 不被修改', () => {
    const values = { a: 3, b: 4 };
    const before = JSON.stringify(values);
    evalExpr('a + b', { a: 'number', b: 'number' }, values);
    expect(JSON.stringify(values)).toBe(before);
  });

  it('D35 AST 不被修改（求值前后完全一致）', () => {
    const def = makeDefinition({ a: 'number' });
    const ast = parseExpression(tokenizeExpression('a + 1'));
    const validated = validateExpression(ast, def);
    const before = JSON.stringify(ast);
    evaluate(validated.ast, { variables: { a: 1 }, builtins: {} });
    expect(JSON.stringify(ast)).toBe(before);
  });
});
