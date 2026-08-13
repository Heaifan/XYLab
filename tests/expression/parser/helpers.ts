// R2-03B 测试共享工具（非 test 文件）。
import { expect } from 'vitest';
import { tokenizeExpression } from '../../../src/expression/tokenizer';
import { parseExpression } from '../../../src/expression/syntax/parser';
import { ExpressionParseError } from '../../../src/expression/syntax/parse-error';
import type { ExpressionNode } from '../../../src/expression/syntax/ast';

export function ast(src: string): ExpressionNode {
  return parseExpression(tokenizeExpression(src));
}

export function expectParseError(src: string, code: ExpressionParseError['code']): void {
  try {
    ast(src);
    throw new Error(`预期解析失败但成功: ${JSON.stringify(src)}`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('预期解析失败但成功')) throw e;
    expect(e).toBeInstanceOf(ExpressionParseError);
    expect((e as ExpressionParseError).code).toBe(code);
  }
}
