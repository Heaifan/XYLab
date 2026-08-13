// R2-01 · Experiment Loader 入口。
// 管道：Parse → Schema Validation → Semantic Validation → Normalize → ExperimentDefinition。
// 边界承诺：
//   成功 ⇒ ExperimentDefinition「可信」，Runtime 后续（R2-02 起）不再怀疑字段；
//   失败 ⇒ 必带明确错误码（INVALID_JSON / SCHEMA_VALIDATION_FAILED / 语义错误码），绝不静默纠错。
// 本层不执行公式、不产生 Tick、不修改任何变量值。

import { validateSchema } from './validator';
import { validateSemantics } from './semantic/semantic-validator';
import { normalize } from './normalize';
import type { LoadError, LoadResult } from './loader-types';
import type { RawExperiment } from './raw-types';

export function loadExperiment(source: string | unknown): LoadResult {
  // 1) Parse
  let raw: unknown = source;
  if (typeof source === 'string') {
    try {
      raw = JSON.parse(source);
    } catch {
      return fail('INVALID_JSON', '输入不是合法 JSON');
    }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return fail('INVALID_JSON', '输入必须是实验对象（或实验 JSON 字符串）');
  }

  // 2) Schema Validation（严格模式，未知字段报错；保留 path/keyword/message）
  const schemaErrors = validateSchema(raw);
  if (schemaErrors.length > 0) {
    return {
      ok: false,
      errors: schemaErrors.map((e) => ({
        code: 'SCHEMA_VALIDATION_FAILED',
        message: `${e.keyword}: ${e.message}`,
        path: e.path,
        keyword: e.keyword,
      })),
    };
  }

  // 3) Semantic Validation（引用与含义；一次收集全部错误，不 fail-fast）
  const semanticErrors = validateSemantics(raw as RawExperiment);
  if (semanticErrors.length > 0) {
    return { ok: false, errors: semanticErrors };
  }

  // 4) Normalize → 可信内部格式
  return { ok: true, definition: normalize(raw as RawExperiment) };
}

function fail(code: LoadError['code'], message: string): LoadResult {
  return { ok: false, errors: [{ code, message }] };
}
