// R2-04 · T4：原子提交 + 运行时值守卫。
// 先全量校验，再一次性应用；任何校验失败 → 零写入。
// 冻结：不按 Variable min/max 自动 clamp（UI 范围 ≠ 模拟规则，需要钳制就在公式里显式写 clamp）；
// integer target 不接受小数（不自动 round/截断）；number/boolean 严格类型，无隐式转换。

import type { ExperimentDefinition, VariableType } from '../../protocol/types';
import type { RuntimeState } from '../types';
import type { Change, TickError } from './types';
import type { PendingWrite } from './evaluate-batch';

export type CommitResult = { changes: Change[] } | { error: TickError };

export function commitBatch(definition: ExperimentDefinition, state: RuntimeState, writes: PendingWrite[]): CommitResult {
  for (const w of writes) {
    const def = definition.variables[w.target]; // 存在性由 evaluate-batch 保证
    const err = validateValue(def.type, w);
    if (err) return { error: err };
  }
  const changes: Change[] = [];
  for (const w of writes) {
    const previous = state.variables[w.target];
    if (previous !== w.value) {
      changes.push({ target: w.target, previousValue: previous, currentValue: w.value });
    }
    state.variables[w.target] = w.value;
  }
  return { changes };
}

function validateValue(type: VariableType, w: PendingWrite): TickError | null {
  const v = w.value;
  if (type === 'integer') {
    if (typeof v !== 'number' || !Number.isInteger(v)) {
      return {
        code: 'INTEGER_TARGET_REQUIRES_INTEGER',
        message: `target '${w.target}' 是 integer，结果 ${String(v)} 不是整数（不自动 round/截断）`,
        formulaId: w.formulaId,
        target: w.target,
      };
    }
    return null;
  }
  if (type === 'number') {
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      return {
        code: 'INVALID_TARGET_RUNTIME_VALUE',
        message: `target '${w.target}' 是 number，结果必须是有限数值（得到 ${String(v)}）`,
        formulaId: w.formulaId,
        target: w.target,
      };
    }
    return null;
  }
  if (type === 'boolean') {
    if (typeof v !== 'boolean') {
      return {
        code: 'INVALID_TARGET_RUNTIME_VALUE',
        message: `target '${w.target}' 是 boolean，结果必须是布尔值`,
        formulaId: w.formulaId,
        target: w.target,
      };
    }
    return null;
  }
  return {
    code: 'INVALID_TARGET_RUNTIME_VALUE',
    message: `target '${w.target}' 类型（${type}）不支持 v0.1 写回`,
    formulaId: w.formulaId,
    target: w.target,
  };
}
