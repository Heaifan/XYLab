// UA1 · 监控值列表（Compact Metric Row）：行普通点击 = Selection Toggle（多选加入/移除，立即生效，无 Ctrl/Shift）；
// Detail Chevron 与选择解耦（展开不改变图表选择）；选中态 = 2~3 DIP Accent 指示条 + 极浅背景（不加厚重 Checkbox）。
import { useState, type MouseEvent } from 'react';
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import { effectivePinned, selectedTargets, type ViewState } from '../viewState';
import { IconChevronDown, IconChevronRight, IconDeltaDown, IconDeltaUp, IconEye, IconEyeOff, IconPin, IconPinOff } from '../icons/Icons';
import { buildRows, type MetricRow } from './metricModel';

interface Props {
  def: ExperimentDefinition | null;
  snap: MonitorSnapshot | null;
  lockTime: number | null;
  view: ViewState;
  resolved: string[];
  onToggleSelect: (t: string) => void;
  onSolo: (t: string) => void;
  onTogglePin: (t: string) => void;
  onToggleHide: (t: string) => void;
  onClear: () => void;
}

function Delta({ r }: { r: MetricRow }) {
  if (r.deltaText === '') return null;
  const icon = r.deltaDir === 'up' ? <IconDeltaUp size={12} /> : r.deltaDir === 'down' ? <IconDeltaDown size={12} /> : null;
  return <span className={`mrow-delta delta-${r.deltaDir}`}>{icon}{r.deltaText}</span>;
}

export function ValuesPanel(p: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = buildRows(p.def, p.snap, p.lockTime);
  if (!p.snap) return <section className="panel"><h2>监控值</h2><p className="muted">加载实验后显示。</p></section>;
  if (rows.length === 0) return <section className="panel"><h2>监控值</h2><p className="muted">该实验未声明 watch。</p></section>;
  const dense = rows.length > 8;
  const pinned = effectivePinned(p.view, p.resolved);
  const selCount = selectedTargets(p.view, p.resolved).length;
  const via = (e: MouseEvent, fn: () => void) => { e.stopPropagation(); fn(); };
  return (
    <section className="panel">
      <div className="values-head">
        <h2>监控值 · 已选 {selCount} / {rows.length}</h2>
        <button onClick={p.onClear} disabled={selCount === 0}>清空</button>
      </div>
      <div className="mlist">
        {rows.map((r) => {
          const sel = p.view.selected.includes(r.target);
          const isPinned = pinned.includes(r.target);
          const isHidden = p.view.hidden.includes(r.target);
          const isOpen = open === r.target;
          const cls = `mrow${sel ? ' sel' : ''}${r.status === 'warning' ? ' warn' : ''}${isHidden ? ' hid' : ''}`;
          if (dense && !isOpen) {
            return (
              <div key={r.target} className={`${cls} dense`} onClick={() => p.onToggleSelect(r.target)}>
                <span className="mrow-label">{r.label}</span>
                <span className="mrow-value">
                  {r.value}
                  {r.unit !== '' && <span className="mrow-unit"> {r.unit}</span>}
                </span>
                <Delta r={r} />
                <button className="mrow-exp" aria-label="展开" onClick={(e) => via(e, () => setOpen(r.target))}><IconChevronRight size={12} /></button>
              </div>
            );
          }
          return (
            <div key={r.target} className={cls} onClick={() => p.onToggleSelect(r.target)}>
              <div className="mrow-top">
                <span className="mrow-label">{r.label}</span>
                <span className="mrow-value">
                  {r.value}
                  {r.unit !== '' && <span className="mrow-unit"> {r.unit}</span>}
                </span>
                <button className="mrow-exp" aria-label={isOpen ? '收起' : '展开'} onClick={(e) => via(e, () => setOpen(isOpen ? null : r.target))}>
                  {isOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                </button>
              </div>
              <div className="mrow-mid">
                <span className="mrow-target">{r.target} · {r.modeText}</span>
                <Delta r={r} />
              </div>
              {isOpen && (
                <div className="mrow-detail">
                  <span className="mrow-stats">
                    {r.stats ? `初值 ${r.stats.initial} · Δ ${r.deltaText} · min ${r.stats.min} · max ${r.stats.max} · avg ${r.stats.average} · n ${r.stats.samples}` : r.detail}
                  </span>
                  <div className="mrow-actions">
                    <button onClick={(e) => via(e, () => p.onSolo(r.target))}>{sel ? '仅看此项' : '单独查看'}</button>
                    <button onClick={(e) => via(e, () => p.onTogglePin(r.target))}>{isPinned ? <IconPinOff size={12} /> : <IconPin size={12} />} {isPinned ? '取消固定' : '固定'}</button>
                    <button onClick={(e) => via(e, () => p.onToggleHide(r.target))}>{isHidden ? <IconEye size={12} /> : <IconEyeOff size={12} />} {isHidden ? '显示' : '隐藏'}</button>
                  </div>
                </div>
              )}
              {!isOpen && <div className="mrow-stats">{r.stats ? `min ${r.stats.min} · max ${r.stats.max} · avg ${r.stats.average} · n ${r.stats.samples}` : r.detail}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
