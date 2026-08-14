// FE-A-R2/BATCH-2 · 剪贴板与可往返加载的外部实验 JSON 序列化。
import type { ExperimentDefinition } from '../../protocol/types';
import { experimentDocument } from '../../protocol/serialize';
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text); return true;
    }
  } catch { /* 落入降级路径 */ }
  try {
    const ta = document.createElement('textarea'); ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok;
  } catch { return false; }
}
export function definitionJson(definition: ExperimentDefinition): string {
  return JSON.stringify(experimentDocument(definition), null, 2);
}
