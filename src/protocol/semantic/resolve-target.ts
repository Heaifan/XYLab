// R2-01 · 目标解析：变量名 → 'variable'；entityId.stateKey → 'entity'；否则 null。
// 变量名不含点号、实体 id 不含点号（Schema 已保证），首个点号分割无歧义。

import type { RawExperiment } from '../raw-types';

export function resolveTarget(raw: RawExperiment, target: string): 'variable' | 'entity' | null {
  const dot = target.indexOf('.');
  if (dot === -1) {
    const vars = raw.variables ?? {};
    return Object.prototype.hasOwnProperty.call(vars, target) ? 'variable' : null;
  }
  const id = target.slice(0, dot);
  const key = target.slice(dot + 1);
  const entity = (raw.entities ?? []).find((e) => e.id === id);
  if (!entity || !entity.state || !Object.prototype.hasOwnProperty.call(entity.state, key)) return null;
  return 'entity';
}
