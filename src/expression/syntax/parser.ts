// R2-03B · Parser 入口：Token[] → AST（纯语法，无任何语义）。
// 边界：不做变量存在性/函数白名单/参数数量/类型检查（R2-03C），不计算（R2-03D）。

import type { Token } from '../token';
import type { ExpressionNode } from './ast';
import { ExpressionParseError } from './parse-error';
import { parseBinary } from './parse-operators';

export function parseExpression(tokens: Token[]): ExpressionNode {
  const [node, pos] = parseBinary(tokens, 0, 1);
  const t = tokens[pos];
  if (t && t.type !== 'EOF') {
    throw new ExpressionParseError('TRAILING_TOKEN', `表达式后有多余 token '${t.lexeme}'`, t.span);
  }
  return node;
}
