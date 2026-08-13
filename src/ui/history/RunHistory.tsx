// FE-A-R2 · 实验历史：newest first；点击展开（摘要/备注/统计/事件数/复制该 Run 的 JSON）。
// Run Compare 本轮不做。数据 = App 注入的 SavedRun[]（localStorage 投影）。
import { useState } from 'react';
import { copyText, definitionJson } from '../actions/clipboard';
import { formatMetric } from '../format';
import { runLabel, sortRuns } from './runStore';
import type { SavedRun } from './types';

function whenText(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return d.toDateString() === now.toDateString() ? `今天 ${hm}` : `${d.getMonth() + 1}-${d.getDate()} ${hm}`;
}

function summaryOf(run: SavedRun): string {
  const parts: string[] = [];
  for (const [target, stats] of Object.entries(run.monitorSnapshot.statistics)) {
    parts.push(stats.kind === 'numeric' ? `${target} ${formatMetric(stats.current)}` : `${target} ${String(stats.current)}`);
    if (parts.length >= 3) break;
  }
  return parts.length > 0 ? parts.join(' · ') : '无统计';
}

function RunDetail({ run }: { run: SavedRun }) {
  const events = run.monitorSnapshot.logs.filter((l) => l.kind === 'event').length;
  return (
    <div className="run-detail">
      <div className="muted">
        状态 {run.runtimeStatus} · t={run.time} · Tick {run.tickIndex} · 事件 {events} 条
      </div>
      <table className="values">
        <tbody>
          {Object.entries(run.monitorSnapshot.statistics).map(([t, st]) => (
            <tr key={t}>
              <td>{t}</td>
              <td className="num">
                {st.kind === 'numeric'
                  ? `当前 ${formatMetric(st.current)} · min ${formatMetric(st.min)} · max ${formatMetric(st.max)} · avg ${formatMetric(st.average)}`
                  : `${st.changeCount} 次变化`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {run.note !== '' && <p className="run-note-full">备注：{run.note}</p>}
    </div>
  );
}

export function RunHistory({ runs }: { runs: SavedRun[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const sorted = sortRuns(runs);

  async function copy(run: SavedRun) {
    const ok = await copyText(definitionJson(run.definitionSnapshot));
    setMsg(ok ? `${runLabel(run.runNumber)} JSON 已复制` : '复制失败');
  }

  if (sorted.length === 0) {
    return (
      <section className="panel">
        <h2>实验历史</h2>
        <p className="muted">还没有保存的实验。在监控页点「保存结果」。</p>
      </section>
    );
  }
  return (
    <section className="panel history-panel">
      <h2>实验历史</h2>
      {msg && (
        <p className="feedback-ok" role="status">
          {msg}
        </p>
      )}
      <div className="run-list">
        {sorted.map((run) => (
          <div key={run.runId} className="run-item">
            <button className="run-head" onClick={() => setOpenId(openId === run.runId ? null : run.runId)}>
              <span className="run-title">
                {runLabel(run.runNumber)} <span className="muted">{whenText(run.savedAt)} · {run.experimentName}</span>
              </span>
              <span className="muted">{summaryOf(run)}</span>
              {run.note !== '' && <span className="run-note">“{run.note}”</span>}
            </button>
            {openId === run.runId && (
              <>
                <RunDetail run={run} />
                <button onClick={() => copy(run)}>复制该 Run 的 JSON</button>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
