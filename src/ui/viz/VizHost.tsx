// UA1 · Canvas 调度层：view.viz → 图表实现；Legend 统一渲染（点击 = Selection Toggle，Inspector/Legend/Chart 同源）。
// Temporal Cursor：lockTime 由全部可视化统一消费；Scatter X/Y = 选中前两项自动指派，可下拉改派 + ⇄ 交换。
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import type { ViewState } from '../viewState';
import { labelOf } from './shared';
import { checkVizById } from './compat';
import type { VizCtx } from './compat';
import { TrendChart } from '../charts/trend';
import { BarCharts } from '../charts/bars';
import { ScatterChart } from '../charts/scatter';
import { StateCharts } from '../charts/state';
import { MiscCharts } from '../charts/misc';

interface Props {
  def: ExperimentDefinition | null;
  snap: MonitorSnapshot;
  view: ViewState;
  targets: string[];
  ctx: VizCtx;
  lockTime: number | null;
  onLock: (t: number | null) => void;
  onToggleSelect: (t: string) => void;
  setView: (v: ViewState) => void;
}

export function VizHost(p: Props) {
  const chk = checkVizById(p.view.viz, p.ctx);
  const viz = p.view.viz;
  const legend = (
    <div className="chart-head">
      <div className="legend">
        {p.targets.map((tg, i) => (
          <button key={tg} className={`legend-item legend-btn s-${(i % 4) + 1}`} title="点击移出图表（Inspector 同步）" onClick={() => p.onToggleSelect(tg)}>
            <i />
            {labelOf(p.def, tg)}
          </button>
        ))}
      </div>
      {p.lockTime !== null ? <button onClick={() => p.onLock(null)}>跟随实时</button> : <span className="muted">Tap 图表锁定检查点</span>}
    </div>
  );
  if (p.targets.length === 0 && viz !== 'timeline' && viz !== 'etrack') {
    return <p className="muted">未选择指标——在「监控值」点击行加入图表。</p>;
  }
  if (!chk.ok) {
    return (
      <>
        {p.targets.length > 0 && legend}
        <p className="muted viz-reason">当前不可用：{chk.reason}</p>
      </>
    );
  }
  const common = { series: p.snap.series, targets: p.targets, lockTime: p.lockTime };
  let chart;
  if (viz === 'line' || viz === 'area' || viz === 'step') {
    chart = <TrendChart {...common} mode={p.view.mode} watches={p.snap.watches} events={p.snap.logs} onLock={p.onLock} def={p.def} variant={viz} />;
  } else if (viz === 'bar' || viz === 'hbar' || viz === 'delta') {
    chart = <BarCharts {...common} mode={p.view.mode} watches={p.snap.watches} def={p.def} lastTime={p.snap.session.lastTime} variant={viz} />;
  } else if (viz === 'scatter') {
    const a = p.targets[0], b = p.targets[1];
    const xT = p.view.scatterX && p.targets.includes(p.view.scatterX) ? p.view.scatterX : a;
    const yT = p.view.scatterY && p.targets.includes(p.view.scatterY) ? p.view.scatterY : b;
    chart = (
      <ScatterChart series={p.snap.series} def={p.def} targets={p.targets} xT={xT} yT={yT}
        onAssign={(f, t) => p.setView({ ...p.view, scatterX: f === 'x' ? t : xT, scatterY: f === 'y' ? t : yT })}
        onSwap={() => p.setView({ ...p.view, scatterX: yT, scatterY: xT })} />
    );
  } else if (viz === 'gauge' || viz === 'range' || viz === 'tband') {
    chart = <StateCharts {...common} watches={p.snap.watches} stats={p.snap.statistics} def={p.def} lastTime={p.snap.session.lastTime} variant={viz} />;
  } else {
    chart = <MiscCharts {...common} kind={viz === 'table' ? 'table' : 'timeline'} events={p.snap.logs} def={p.def} onLock={p.onLock} lastTime={p.snap.session.lastTime} />;
  }
  return (
    <div className="chart-wrap">
      {p.targets.length > 0 && legend}
      {chart}
      {p.targets.length > 4 && (viz === 'line' || viz === 'area' || viz === 'step') && (
        <p className="muted chart-note">XYUI-8 8-06：同屏建议 2~4 条曲线，当前 {p.targets.length} 条，可收窄选择。</p>
      )}
    </div>
  );
}
