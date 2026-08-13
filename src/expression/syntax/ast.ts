// R2-03B · AST 节点定义。所有节点携带 SourceSpan（词法 span 的并集），
// 供 R2-03C 语义校验定位错误（如指向 unknown_rate 所在位置）。

export interface SourceSpan {
  start: number;
  end: number;
}

export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '<'
  | '<='
  | '>'
  | '>='
  | '=='
  | '!='
  | '&&'
  | '||';

interface NodeBase {
  span: SourceSpan;
}

export type ExpressionNode =
  | NumberLiteral
  | BooleanLiteral
  | IdentifierNode
  | UnaryExpression
  | BinaryExpression
  | CallExpression;

export interface NumberLiteral extends NodeBase {
  type: 'NumberLiteral';
  value: number; // Parser 由 lexeme 转换（词法层只保留 lexeme）
}

export interface BooleanLiteral extends NodeBase {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface IdentifierNode extends NodeBase {
  type: 'Identifier';
  name: string;
}

export interface UnaryExpression extends NodeBase {
  type: 'UnaryExpression';
  operator: '!' | '-';
  operand: ExpressionNode;
}

export interface BinaryExpression extends NodeBase {
  type: 'BinaryExpression';
  operator: BinaryOperator;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface CallExpression extends NodeBase {
  type: 'CallExpression';
  callee: string;
  arguments: ExpressionNode[];
}
