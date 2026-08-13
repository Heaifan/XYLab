// UI-F1 · 实验文本解析：包装 Loader（唯一入口），返回 UI 可消费的结果。
import { loadExperiment } from '../../protocol/loader';
import type { ExperimentDefinition } from '../../protocol/types';

export type ParseResult = { ok: true; definition: ExperimentDefinition } | { ok: false; errors: string[] };

export function parseExperimentText(text: string): ParseResult {
  const r = loadExperiment(text);
  if (r.ok) return { ok: true, definition: r.definition };
  return { ok: false, errors: r.errors.map((e) => e.message) };
}
