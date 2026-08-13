// R2-03C · 语义错误模型：统一携带 code / message / span，涉及名称时携带 identifier。

import type { SemanticErrorCode, SemanticErrorInfo } from './types';

export class ExpressionSemanticError extends Error implements SemanticErrorInfo {
  readonly code: SemanticErrorCode;
  readonly span: SemanticErrorInfo['span'];
  readonly identifier?: string; // 涉及的名称（identifier / function / target）

  constructor(code: SemanticErrorCode, message: string, span: SemanticErrorInfo['span'], identifier?: string) {
    super(message);
    this.name = 'ExpressionSemanticError';
    this.code = code;
    this.span = span;
    this.identifier = identifier;
  }
}
