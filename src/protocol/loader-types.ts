// Loader 结果与错误类型（协议 §10 错误码的 TS 映射）。

import type { ExperimentDefinition } from './types';

export type LoadErrorCode =
  | 'INVALID_JSON'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'FORMULA_TARGET_NOT_FOUND'
  | 'WATCH_TARGET_NOT_FOUND'
  | 'DUPLICATE_ENTITY_ID'
  | 'UNKNOWN_VARIABLE_REFERENCE'
  | 'INVALID_TIMELINE_RANGE'
  | 'VARIABLE_TYPE_INVALID'
  | 'RESERVED_NAME';

export interface LoadError {
  code: LoadErrorCode;
  message: string;
  path?: string; // JSON Pointer 或字段路径
  keyword?: string; // 仅 Schema 错误
}

export type LoadResult =
  | { ok: true; definition: ExperimentDefinition }
  | { ok: false; errors: LoadError[] };
