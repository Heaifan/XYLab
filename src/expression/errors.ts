// R2-03A · 词法错误模型：不 throw 裸字符串，统一携带 code / message / position。

export type TokenizeErrorCode = 'INVALID_CHARACTER' | 'INVALID_NUMBER';

export class ExpressionTokenizeError extends Error {
  readonly code: TokenizeErrorCode;
  readonly position: number; // 出错字符的起始下标（0-based）

  constructor(code: TokenizeErrorCode, message: string, position: number) {
    super(message);
    this.name = 'ExpressionTokenizeError';
    this.code = code;
    this.position = position;
  }
}
