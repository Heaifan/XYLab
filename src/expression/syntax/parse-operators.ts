// R2-03B · 运算符解析：优先级爬升 + 一元前缀。
// 优先级冻结（低→高）：|| → && → == != → < <= > >= → + - → * / % → unary ! - → primary/call。
// 结合性冻结：当前所有二元运算左结合（递归时传 prec + 1）。
// 与 parse-primary.ts 存在刻意互递归（经典递归下降），ESM 函数声明提升保证安全。

import type { Token, TokenType } from '../token';
import type { BinaryExpression, BinaryOperator, ExpressionNode, UnaryExpression } from './ast';
import { parsePrimary } from './parse-primary';

const BINARY_PRECEDENCE: Record<BinaryOperator, number> = {
  '||': 1,
  '&&': 2,
  '==': 3,
  '!=': 3,
  '<': 4,
  '<=': 4,
  '>': 4,
  '>=': 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '/': 6,
  '%': 6,
};

function tokenToBinaryOp(type: TokenType): BinaryOperator | null {
  switch (type) {
    case 'PLUS':
      return '+';
    case 'MINUS':
      return '-';
    case 'STAR':
      return '*';
    case 'SLASH':
      return '/';
    case 'PERCENT':
      return '%';
    case 'LT':
      return '<';
    case 'LTE':
      return '<=';
    case 'GT':
      return '>';
    case 'GTE':
      return '>=';
    case 'EQ':
      return '==';
    case 'NEQ':
      return '!=';
    case 'AND':
      return '&&';
    case 'OR':
      return '||';
    default:
      return null;
  }
}

export function parseUnary(tokens: Token[], pos: number): [ExpressionNode, number] {
  const t = tokens[pos];
  if (t && (t.type === 'NOT' || t.type === 'MINUS')) {
    const [operand, next] = parseUnary(tokens, pos + 1);
    const node: UnaryExpression = {
      type: 'UnaryExpression',
      operator: t.type === 'NOT' ? '!' : '-',
      operand,
      span: { start: t.span.start, end: operand.span.end },
    };
    return [node, next];
  }
  return parsePrimary(tokens, pos);
}

export function parseBinary(tokens: Token[], pos: number, minPrec: number): [ExpressionNode, number] {
  let [left, i] = parseUnary(tokens, pos);
  for (;;) {
    const t = tokens[i];
    const op = t ? tokenToBinaryOp(t.type) : null;
    if (!op) break;
    const prec = BINARY_PRECEDENCE[op];
    if (prec < minPrec) break;
    i += 1;
    const [right, j] = parseBinary(tokens, i, prec + 1); // 左结合
    const node: BinaryExpression = {
      type: 'BinaryExpression',
      operator: op,
      left,
      right,
      span: { start: left.span.start, end: right.span.end },
    };
    left = node;
    i = j;
  }
  return [left, i];
}
