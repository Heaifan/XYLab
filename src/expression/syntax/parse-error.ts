// R2-03B · 语法错误模型：统一携带 code / message / span（复用词法层 span）。

import type { SourceSpan } from './ast';

export type ParseErrorCode =
  | 'EXPECTED_EXPRESSION'
  | 'UNEXPECTED_TOKEN'
  | 'EXPECTED_RPAREN'
  | 'EXPECTED_COMMA_OR_RPAREN'
  | 'TRAILING_TOKEN';

export class ExpressionParseError extends Error {
  readonly code: ParseErrorCode;
  readonly span: SourceSpan;

  constructor(code: ParseErrorCode, message: string, span: SourceSpan) {
    super(message);
    this.name = 'ExpressionParseError';
    this.code = code;
    this.span = span;
  }
}
