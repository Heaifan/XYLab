// FE-A-R2 · 底部导航（Compact 主导航）：实验/监控/日志/历史。参数不再独占一级导航（归入「实验」）。
// 图标 = 内联 SVG 手绘（禁 emoji/字符图标）；文字+图标双通道。
import type { ReactNode } from 'react';

export type LabTab = 'experiment' | 'monitor' | 'log' | 'history';

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const ICONS: Record<LabTab, ReactNode> = {
  experiment: (
    <svg viewBox="0 0 20 20" {...S} aria-hidden="true">
      <path d="M8 2.5h4M8.7 2.5v4.2L4.6 13.6a2.8 2.8 0 0 0 2.5 4h5.8a2.8 2.8 0 0 0 2.5-4L11.3 6.7V2.5" />
      <path d="M6.5 12.5h7" />
    </svg>
  ),
  monitor: (
    <svg viewBox="0 0 20 20" {...S} aria-hidden="true">
      <path d="M2.5 10.5h3.2l1.8-4.8 2.8 8.6 1.9-3.8h5.3" />
    </svg>
  ),
  log: (
    <svg viewBox="0 0 20 20" {...S} aria-hidden="true">
      <path d="M4 5.5h12M4 10h12M4 14.5h7.5" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 20 20" {...S} aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 6.2V10l2.6 1.8" />
    </svg>
  ),
};

const ITEMS: Array<{ id: LabTab; label: string }> = [
  { id: 'experiment', label: '实验' },
  { id: 'monitor', label: '监控' },
  { id: 'log', label: '日志' },
  { id: 'history', label: '历史' },
];

export function BottomNav({ tab, onTab }: { tab: LabTab; onTab: (t: LabTab) => void }) {
  return (
    <nav className="bottomnav">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          className={tab === it.id ? 'nav-item active' : 'nav-item'}
          onClick={() => onTab(it.id)}
          aria-current={tab === it.id ? 'page' : undefined}
        >
          {ICONS[it.id]}
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
