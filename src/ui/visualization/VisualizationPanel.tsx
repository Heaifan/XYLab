// FE-A-R2 · Visualization 容器：Metric Strip + SVG LineChart（XYUI-8 VisualizationContainer 组合）。
// Series 解析规则：output.charts 声明优先（x 必须 = time）；无声明 → fallback Watch 中前 2~4 个 Numeric Series。
// 数据唯一来源 MonitorSnapshot.series —— 不制造第二套状态。
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import { MetricStrip } from './MetricStrip';
import { LineChart } from './LineChart';

export function resolveChartTargets(definition: ExperimentDefinition | null, snap: MonitorSnapshot | null): string[] {
  if (!snap) return [];
  const declared = (definition?.output?.charts ?? []).filter((c) => c.x === 'time' && snap.series[c.y] !== undefined);
  if (declared.length > 0) return [...new Set(declared.map((c) => c.y))];
  const numeric = snap.watches.filter((w) => w.type === 'number' || w.type === 'integer').map((w) => w.target);
  return [...new Set(numeric)].slice(0, 4);
}

interface Props {
  definition: ExperimentDefinition | null;
  snap: MonitorSnapshot | null;
  lockTime: number | null;
  onLock: (t: number | null) => void;
}

export function VisualizationPanel({ definition, snap, lockTime, onLock }: Props) {
  if (!snap) {
    return (
      <section className="panel">
        <h2>可视化</h2>
        <p className="muted">加载实验后显示。</p>
      </section>
    );
  }
  const targets = resolveChartTargets(definition, snap);
  return (
    <section className="panel viz-panel">
      <MetricStrip def={definition} snap={snap} lockTime={lockTime} />
      {targets.length > 0 ? (
        <LineChart series={snap.series} targets={targets} watches={snap.watches} events={snap.logs} lockTime={lockTime} onLock={onLock} />
      ) : (
        <p className="muted">无可绘制的数值 Series。</p>
      )}
    </section>
  );
}
