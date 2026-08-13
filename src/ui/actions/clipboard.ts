// FE-A-R2 · 剪贴板与当前有效 JSON 序列化。
// 复制目标 = App 持有的当前有效 Definition（Apply 后已是新 Definition），绝不复制旧 Draft。
import type { ExperimentDefinition } from '../../protocol/types';

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 落入降级路径 */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function definitionJson(definition: ExperimentDefinition): string {
  return JSON.stringify(definition, null, 2);
}
