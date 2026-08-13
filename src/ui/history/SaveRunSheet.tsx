// FE-A-R2 · 保存实验（XYUI-7 Bottom Sheet，禁大 Dialog）：结果摘要 + 备注 + [保存实验结果]/[保存并复制 JSON]。
// 只手动保存（禁自动保存）；V1 = localStorage；成败明确反馈。Definition Snapshot 随 Run 落盘。
import { useState } from 'react';
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import { copyText, definitionJson } from '../actions/clipboard';
import { resolveMetrics } from '../monitor/metricModel';
import { buildRun, loadRuns, nextRunNumber, runLabel, safeStorage, saveRun } from './runStore';

interface Props {
  open: boolean;
  definition: ExperimentDefinition | null;
  snap: MonitorSnapshot | null;
  runtimeStatus: string;
  time: number;
  tickIndex: number;
  onClose: () => void;
  onSaved: () => void;
}

export function SaveRunSheet({ open, definition, snap, runtimeStatus, time, tickIndex, onClose, onSaved }: Props) {
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  if (!open || !definition || !snap) return null;
  const def = definition;
  const s = snap;
  const metrics = resolveMetrics(def, s, null);
  const warnCount = s.logs.filter((l) => l.kind === 'event' && (l.level === 'warning' || l.level === 'critical')).length;
  const num = nextRunNumber(loadRuns(safeStorage()));

  async function persist(copyJson: boolean) {
    const res = saveRun(safeStorage(), buildRun(def, s, runtimeStatus, time, tickIndex, num, note.trim(), Date.now()));
    if (!res.ok) {
      setFeedback({ text: `保存失败：${res.error}`, ok: false });
      return;
    }
    onSaved();
    setNote('');
    if (copyJson) {
      const ok = await copyText(definitionJson(def));
      setFeedback({ text: ok ? '已保存，JSON 已复制' : '已保存，但复制失败', ok });
    } else {
      setFeedback({ text: '实验结果已保存', ok: true });
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="保存实验">
        <h2>保存实验</h2>
        <p className="muted">
          {runLabel(num)} · t={time} · Tick {tickIndex} · {runtimeStatus}
        </p>
        <div className="save-summary">
          {metrics.map((m) => (
            <div className="inspector-row" key={m.target}>
              <span>{m.label}</span>
              <b>
                {m.value}
                {m.unit !== '' && ` ${m.unit}`}
              </b>
              <span className="muted">{m.detail}</span>
            </div>
          ))}
          {warnCount > 0 && <div className="inspector-alert level-warning">Warning/Critical 事件 {warnCount} 条</div>}
        </div>
        <label className="muted" htmlFor="run-note">
          备注
        </label>
        <textarea id="run-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="记录这次实验的结论，例如：70% 阈值还是偏早，下次降低疲劳率" />
        <div className="sheet-actions">
          <button className="primary" onClick={() => persist(false)}>
            保存实验结果
          </button>
          <button onClick={() => persist(true)}>保存并复制 JSON</button>
          {feedback && (
            <p role="status" className={feedback.ok ? 'feedback-ok' : 'feedback-err'}>
              {feedback.text}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
