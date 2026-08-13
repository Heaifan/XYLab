// R2-03D · 运行期求值错误模型：统一携带 code / message / span。
// span 关联到 AST 节点，R4 以后可直接在公式编辑器标红（03A→03B 保存 span 的价值在此兑现）。

import type { SourceSpan } from '../syntax/ast';
import type { EvaluationErrorCode } from './types';

export class ExpressionEvaluationError extends Error {
  readonly code: EvaluationErrorCode;
  readonly span: SourceSpan;

  constructor(code: EvaluationErrorCode, message: string, span: SourceSpan) {
    super(message);
    this.name = 'ExpressionEvaluationError';
    this.code = code;
    this.span = span;
  }
}
