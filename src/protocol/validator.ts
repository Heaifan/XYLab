// R2-01 · Schema 校验层：ajv + R1 冻结的 draft-07 Schema（严格模式，未知字段报错）。
// 只做结构校验；语义校验见 semantic-validator.ts。

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// R1 冻结的协议 Schema（repo 根 schema/experiment.schema.json）。
// 注意：R4 浏览器化时需改为打包注入或 fetch；Node 侧暂用 fs 读取，Schema 本体不动。
const schemaPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../schema/experiment.schema.json',
);
const SCHEMA = JSON.parse(readFileSync(schemaPath, 'utf-8')) as object;

const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
// strictRequired: false —— ajv 该规则不允许「if/then 分支的 required 引用同级未定义属性」，
// 而 R1 冻结 Schema 用该模式表达条件必填（enum→options、threshold 模式→threshold）。
// Schema 本身是合法 draft-07（Python jsonschema 验证通过），仅关闭 ajv 这一条过严 lint。
addFormats(ajv); // created_at 的 date-time format 校验需要
const validate = ajv.compile(SCHEMA);

export interface SchemaErrorDetail {
  path: string; // instancePath（JSON Pointer）
  keyword: string;
  message: string;
}

export function validateSchema(raw: unknown): SchemaErrorDetail[] {
  if (validate(raw)) return [];
  return (validate.errors ?? []).map((e) => ({
    path: e.instancePath || '/',
    keyword: e.keyword,
    message: e.message ?? '',
  }));
}
