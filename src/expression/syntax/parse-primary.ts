// R2-03B · 原子解析：字面量 / 标识符 / 括号分组 / 函数调用。
// Parser 只判断「语法是否合法」：banana(a) 也 PASS —— 函数白名单是 R2-03C 的职责。
// 与 parse-operators.ts 存在刻意互递归（经典递归下降），ESM 函数声明提升保证安全。

import type { Token } from '../token';
import type { BooleanLiteral, CallExpression, ExpressionNode, IdentifierNode, NumberLiteral, SourceSpan } from './ast';
import { ExpressionParseError } from './parse-error';
import { parseBinary } from './parse-operators';

function union(a: SourceSpan, b: SourceSpan): SourceSpan {
  return { start: a.start, end: b.end };
}

export function parsePrimary(tokens: Token[], pos: number): [ExpressionNode, number] {
  const t = tokens[pos];
  if (!t || t.type === 'EOF') {
    const span: SourceSpan = t ? t.span : { start: 0, end: 0 };
    throw new ExpressionParseError('EXPECTED_EXPRESSION', '表达式为空或提前结束', span);
  }
  switch (t.type) {
    case 'NUMBER': {
      const node: NumberLiteral = { type: 'NumberLiteral', value: Number(t.lexeme), span: t.span };
      return [node, pos + 1];
    }
    case 'BOOLEAN': {
      const node: BooleanLiteral = { type: 'BooleanLiteral', value: t.lexeme === 'true', span: t.span };
      return [node, pos + 1];
    }
    case 'IDENTIFIER': {
      const next = tokens[pos + 1];
      if (next && next.type === 'LPAREN') return parseCall(tokens, pos);
      const node: IdentifierNode = { type: 'Identifier', name: t.lexeme, span: t.span };
      return [node, pos + 1];
    }
    case 'LPAREN': {
      const [inner, after] = parseBinary(tokens, pos + 1, 1);
      const close = tokens[after];
      if (!close || close.type !== 'RPAREN') {
        const span: SourceSpan = close ? close.span : { start: t.span.end, end: t.span.end };
        throw new ExpressionParseError('EXPECTED_RPAREN', `括号表达式缺少 ')'`, span);
      }
      return [inner, after + 1];
    }
    case 'RPAREN':
      throw new ExpressionParseError('UNEXPECTED_TOKEN', `Unexpected token ')'`, t.span);
    default:
      // 运算符/逗号等出现在表达式起点（如 1 + * 2 中的 *）
      throw new ExpressionParseError('EXPECTED_EXPRESSION', `期望表达式起点，得到 '${t.lexeme}'`, t.span);
  }
}

function parseCall(tokens: Token[], pos: number): [ExpressionNode, number] {
  const callee = tokens[pos]; // IDENTIFIER（parsePrimary 已确认）
  const args: ExpressionNode[] = [];
  let i = pos + 2; // 跳过 '('
  const first = tokens[i];
  if (first && first.type === 'RPAREN') {
    const node: CallExpression = { type: 'CallExpression', callee: callee.lexeme, arguments: args, span: union(callee.span, first.span) };
    return [node, i + 1];
  }
  for (;;) {
    const [arg, j] = parseBinary(tokens, i, 1);
    args.push(arg);
    const t = tokens[j];
    if (!t || t.type === 'EOF') {
      const span: SourceSpan = t ? t.span : { start: callee.span.end, end: callee.span.end };
      throw new ExpressionParseError('EXPECTED_COMMA_OR_RPAREN', `函数 '${callee.lexeme}' 参数列表缺少 ')'`, span);
    }
    if (t.type === 'RPAREN') {
      const node: CallExpression = { type: 'CallExpression', callee: callee.lexeme, arguments: args, span: union(callee.span, t.span) };
      return [node, j + 1];
    }
    if (t.type === 'COMMA') {
      i = j + 1;
      continue;
    }
    throw new ExpressionParseError('EXPECTED_COMMA_OR_RPAREN', `期望 ',' 或 ')'，得到 '${t.lexeme}'`, t.span);
  }
}
