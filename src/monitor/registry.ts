// R3 · Watch Registry：从 Definition.watch 构建监控登记表（含未知 target / 缺 threshold 防御）。
// 冻结：防御不静默——非法 watch 跳过并产生一条 runtime 警告日志（由 session 落账）。

import type { ExperimentDefinition } from '../protocol/types';
import type { WatchRecord } from './types';

export interface RegistryWarning {
  target?: string;
  message: string;
}

export interface RegistryResult {
  watches: WatchRecord[];
  warnings: RegistryWarning[];
}

export function buildWatchRegistry(definition: ExperimentDefinition): RegistryResult {
  const watches: WatchRecord[] = [];
  const warnings: RegistryWarning[] = [];

  for (const w of definition.watch) {
    const def = definition.variables[w.target];
    if (!def) {
      warnings.push({ target: w.target, message: `Watch target '${w.target}' 不存在，已跳过` });
      continue;
    }
    if (w.mode === 'threshold' && w.threshold === undefined) {
      warnings.push({ target: w.target, message: `threshold 模式 watch '${w.target}' 缺少 threshold，已跳过` });
      continue;
    }
    watches.push({ target: w.target, mode: w.mode, threshold: w.threshold, operator: w.operator ?? '>=', type: def.type });
  }
  return { watches, warnings };
}
