// R2-01 · 语义校验编排：聚合变量域与引用域规则，一次收集全部错误（不 fail-fast）。
// 边界：公式表达式内部标识符、事件 when 引用需要表达式解析器（R2-03C），本层不解析表达式。

import type { LoadError } from '../loader-types';
import type { RawExperiment } from '../raw-types';
import { checkVariables } from './variable-rules';
import { checkReferences } from './reference-rules';

export function validateSemantics(raw: RawExperiment): LoadError[] {
  const errors: LoadError[] = [];
  checkVariables(raw, errors);
  checkReferences(raw, errors);
  return errors;
}
