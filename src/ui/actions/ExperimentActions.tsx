// FE-A-R2 · 一级动作条：[复制 JSON][保存结果] 手机/PC 直显（禁藏进「···」菜单）。
// 复制 = 当前有效 Definition JSON；反馈 = 轻量行内文字（禁大 Dialog）。
import { useState } from 'react';
import type { ExperimentDefinition } from '../../protocol/types';
import { copyText, definitionJson } from './clipboard';

interface Props {
  definition: ExperimentDefinition | null;
  onSave: () => void;
}

export function ExperimentActions({ definition, onSave }: Props) {
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  async function copy() {
    if (!definition) return;
    const ok = await copyText(definitionJson(definition));
    setFeedback({ text: ok ? 'JSON 已复制' : '复制失败', ok });
    window.setTimeout(() => setFeedback(null), 2000);
  }

  return (
    <div className="actions">
      <button className="primary" disabled={!definition} onClick={copy}>
        复制 JSON
      </button>
      <button className="primary" disabled={!definition} onClick={onSave}>
        保存结果
      </button>
      {feedback && (
        <span className={`feedback ${feedback.ok ? 'feedback-ok' : 'feedback-err'}`} role="status">
          {feedback.ok ? '✓' : '✕'} {feedback.text}
        </span>
      )}
    </div>
  );
}
