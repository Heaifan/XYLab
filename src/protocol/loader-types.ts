// Loader 结果与错误类型（协议错误码的 TS 映射）。
import type { ExperimentDefinition } from './types';
export type LoadErrorCode =
  | 'INVALID_JSON' | 'SCHEMA_VALIDATION_FAILED' | 'FORMULA_TARGET_NOT_FOUND'
  | 'WATCH_TARGET_NOT_FOUND' | 'DUPLICATE_ENTITY_ID' | 'UNKNOWN_VARIABLE_REFERENCE'
  | 'INVALID_TIMELINE_RANGE' | 'VARIABLE_TYPE_INVALID' | 'RESERVED_NAME'
  | 'BATCH_VARIABLE_NOT_FOUND' | 'BATCH_VARIABLE_DUPLICATE' | 'BATCH_VALUE_INVALID'
  | 'BATCH_RANGE_INVALID' | 'BATCH_SCENARIO_LIMIT_EXCEEDED';
export interface LoadError {
  code: LoadErrorCode;
  message: string;
  path?: string;
  keyword?: string;
}
export type LoadResult =
  | { ok: true; definition: ExperimentDefinition }
  | { ok: false; errors: LoadError[] };
