// R2-04 · Tick 结果与错误类型。

import type { SourceSpan } from '../../expression/syntax/ast';
import type { EvalValue } from '../../expression/evaluation/types';
import type { RuntimeState, RuntimeValue } from '../types';

export interface Change {
  target: string;
  previousValue: RuntimeValue;
  currentValue: EvalValue;
}

export interface TickResult {
  previousTime: number;
  currentTime: number;
  previousTickIndex: number;
  currentTickIndex: number;
  changes: Change[]; // 仅实际发生变化的 target（R3 Watch/Event 的直接输入）
  state: RuntimeState; // 成功 Tick 后已就地提交的同一 state（遵守 R2-02 mutable 合同）
}

export type TickErrorCode =
  | 'DUPLICATE_FORMULA_TARGET'
  | 'UNSUPPORTED_TARGET_KIND'
  | 'FORMULA_SEMANTIC_ERROR'
  | 'FORMULA_EVALUATION_ERROR'
  | 'INVALID_TARGET_RUNTIME_VALUE'
  | 'INTEGER_TARGET_REQUIRES_INTEGER';

export interface TickError {
  code: TickErrorCode;
  message: string;
  formulaId?: string;
  target?: string;
  causeCode?: string; // 底层原始错误码（如 DIVISION_BY_ZERO / UNKNOWN_IDENTIFIER）
  span?: SourceSpan;
}

export type TickOutcome =
  | { status: 'success'; result: TickResult }
  | { status: 'duration-reached'; time: number; tickIndex: number }
  | { status: 'failed'; error: TickError; time: number; tickIndex: number };
