// UA1 · Pinned Metric Cards（SnapshotRail，XYUI-8 8-01/8-03 消费）：只渲染 effectivePinned 目标；Pinned ≠ Selected（两概念不绑死）。
// 卡片点击 = Selection Toggle（与监控值行/图例同源）；模型与监控值列表共用 metricModel.buildRows 唯一模型。
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import { buildRows } from '../monitor/metricModel';

interface Props {
  def: ExperimentDefinition | null;
  snap: MonitorSnapshot | null;
  lockTime: number | null;
  pinned: string[];
  onToggle: (t: string) => void;
}

export function MetricStrip({ def, snap, lockTime, pinned, onToggle }: Props) {
  if (!snap || pinned.length === 0) return null;
  const byTarget = new Map(buildRows(def, snap, lockTime).map((r) => [r.target, r]));
  const cards = pinned.map((t) => byTarget.get(t)).filter((r) => r !== undefined);
  if (cards.length === 0) return null;
  return (
    <div className="metric-strip" role="list">
      {cards.map((m) => (
        <button key={m.target} className={`metric status-${m.status}`} role="listitem" title="点击加入/移出图表选择" onClick={() => onToggle(m.target)}>
          <div className="metric-label">{m.label}</div>
          <div className="metric-value">
            {m.value}
            {m.unit !== '' && <span className="metric-unit">{m.unit}</span>}
          </div>
          <div className="metric-sub">
            <span>{m.detail}</span>
            {m.status === 'warning' && <span className="metric-flag">WARNING</span>}
          </div>
        </button>
      ))}
    </div>
  );
}
