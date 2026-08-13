// UA1 · Visualization Picker（XYUI-8 Catalog 入口）：桌面 = 下拉菜单 / Compact 竖屏 = Bottom Sheet（XYUI-7 消费组合）。
// 推荐（★）置顶 + 分类分组；Disabled 项保留可见并说明原因（不删入口）；高频操作一层直达（8-01 原则）。
import { useState, type ComponentType } from 'react';
import { CATS, CATALOG, byId } from './catalog';
import { checkViz, recommend, type VizCtx } from './compat';
import { IconBars, IconChart, IconChevronDown, IconClock, IconGauge, IconGrid, IconPie, IconScatter, IconTable } from '../icons/Icons';

const CAT_ICON: Record<string, ComponentType<{ size?: number }>> = {
  trend: IconChart, compare: IconBars, relation: IconScatter, state: IconGauge,
  composition: IconPie, distribution: IconGrid, process: IconClock, advanced: IconTable,
};

interface Props {
  ctx: VizCtx;
  current: string;
  compact: boolean;
  onPick: (id: string) => void;
}

export function VizPicker({ ctx, current, compact, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const pick = (id: string) => {
    onPick(id);
    setOpen(false);
  };
  const items = (ids: string[]) =>
    ids.map((id) => {
      const d = byId(id)!;
      const chk = checkViz(d, ctx);
      const Icon = CAT_ICON[d.cat];
      return (
        <button key={id} className={`viz-item${id === current ? ' cur' : ''}`} disabled={!chk.ok} onClick={() => pick(id)} title={chk.ok ? d.label : chk.reason}>
          <Icon size={14} />
          <span className="viz-item-label">{d.label}</span>
          {!chk.ok && <span className="viz-item-why">{chk.reason}</span>}
          {id === current && <span className="viz-item-cur">当前</span>}
        </button>
      );
    });
  const body = (
    <>
      <div className="viz-sec">推荐</div>
      {items(recommend(ctx))}
      {CATS.map((c) => (
        <div key={c.id}>
          <div className="viz-sec">{c.label}</div>
          {items(CATALOG.filter((d) => d.cat === c.id).map((d) => d.id))}
        </div>
      ))}
    </>
  );
  return (
    <div className="viz-picker">
      <button className="viz-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>
        <IconChart size={14} /> {byId(current)?.label ?? '折线图'} <IconChevronDown size={12} />
      </button>
      {open && (compact ? (
        <>
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="sheet viz-sheet" role="dialog" aria-label="可视化目录">{body}</div>
        </>
      ) : (
        <div className="viz-menu" role="dialog" aria-label="可视化目录">{body}</div>
      ))}
    </div>
  );
}
