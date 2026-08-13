// R2-03A · Token 类型（词法层）。Tokenizer 只负责「字符 → Token」，
// 不做语法正确性判断（`1 + * 2` 仍是合法 token 流，报错是 R2-03B Parser 的职责）。

export type TokenType =
  | 'NUMBER'
  | 'IDENTIFIER'
  | 'BOOLEAN'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'PERCENT'
  | 'LT'
  | 'LTE'
  | 'GT'
  | 'GTE'
  | 'EQ'
  | 'NEQ'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF';

export interface Token {
  type: TokenType;
  lexeme: string;
  span: { start: number; end: number }; // 位置必须保留：Parser 报错直接复用
}
