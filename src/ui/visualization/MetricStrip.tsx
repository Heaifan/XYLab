// F2 · Pinned Metric Cards（顶部 ≤6）：核心指标速览层，只渲染 effectivePinned 目标（自动=解析目标前 6）。
// 模型与监控值列表共用 metricModel.buildRows（唯一模型）；卡片点击 = 图表聚焦。
// 全量 Watch 的展开/对比/固定/隐藏管理归监控值列表；状态文字+颜色双通道（ColorOnlyState Forbidden）。
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import { buildRows } from '../monitor/metricModel';

interface Props {
  def: ExperimentDefinition | null;
  snap: MonitorSnapshot | null;
  lockTime: number | null;
  pinned: string[];
  onFocus: (t: string) => void;
}

export function MetricStrip({ def, snap, lockTime, pinned, onFocus }: Props) {
  if (!snap || pinned.length === 0) return null;
  const byTarget = new Map(buildRows(def, snap, lockTime).map((r) => [r.target, r]));
  const cards = pinned.map((t) => byTarget.get(t)).filter((r) => r !== undefined);
  if (cards.length === 0) return null;
  return (
    <div className="metric-strip" role="list">
      {cards.map((m) => (
        <button key={m.target} className={`metric status-${m.status}`} role="listitem" onClick={() => onFocus(m.target)}>
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
