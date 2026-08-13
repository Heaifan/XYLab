// R4-F1 · 参数草稿：UI 侧类型守卫 + 通过正式 Runtime 初始化边界生效。
// 冻结：React 禁止直写模拟内部状态；参数修改 = 草稿覆盖 → withInitialValues 生成新 Definition
// → createController 重建 Runtime（正式初始化边界）。原始 Definition 永不修改（RS-01）。
import type { ExperimentDefinition, VariableDefinition } from '../../protocol/types';

export type DraftOverrides = Record<string, number | boolean | string>;

export function isValidValue(type: VariableDefinition['type'], value: number | boolean | string): boolean {
  switch (type) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'enum':
    case 'string':
      return typeof value === 'string';
  }
}

export function withInitialValues(definition: ExperimentDefinition, overrides: DraftOverrides): ExperimentDefinition {
  const variables: ExperimentDefinition['variables'] = {};
  for (const [name, v] of Object.entries(definition.variables)) {
    const next = overrides[name];
    variables[name] = next !== undefined && isValidValue(v.type, next) ? { ...v, value: next } : v;
  }
  return { ...definition, variables };
}

export function hasDraftChanges(definition: ExperimentDefinition, overrides: DraftOverrides): boolean {
  return Object.entries(overrides).some(([name, next]) => {
    const v = definition.variables[name];
    return v !== undefined && v.value !== next;
  });
}
