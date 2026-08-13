// R2-03D · 求值上下文与返回值类型。
// v0.1 求值结果只有 number | boolean（string/enum/object/entity 一律不进表达式）。

import type { SourceSpan } from '../syntax/ast';

export type EvalValue = number | boolean;

export interface EvaluationContext {
  variables: Readonly<Record<string, EvalValue>>;
  builtins: Readonly<Record<string, EvalValue>>;
}

export type EvaluationErrorCode =
  | 'MISSING_RUNTIME_VALUE'
  | 'RUNTIME_TYPE_MISMATCH'
  | 'DIVISION_BY_ZERO'
  | 'MODULO_BY_ZERO'
  | 'NON_FINITE_RESULT'
  | 'DOMAIN_ERROR'
  | 'INVALID_CLAMP_RANGE'
  | 'UNKNOWN_EVALUATOR_NODE'
  | 'INTERNAL_EVALUATION_ERROR';

export interface EvaluationErrorInfo {
  code: EvaluationErrorCode;
  message: string;
  span: SourceSpan;
}
