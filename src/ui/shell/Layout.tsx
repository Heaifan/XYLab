// F2 · 三模式响应式组合（组件不换、语义不换，只改组合位置）。
// Compact（<640 主设计）：单栏 + Bottom Nav（监控首屏=动作条/运行/可视化/监控值行/Inspector）；
// Medium（640~1023）：实验/参数辅助栏 + 主工作区（监控值行 + Inspector 并入主区）；
// Wide（≥1024）：左(实验+参数) 中(动作+运行+可视化) 右(Inspector+监控值行) 底(事件日志)。
import type { ReactNode } from 'react';
import type { Breakpoint } from './breakpoints';
import { BottomNav } from './BottomNav';
import type { LabTab } from './BottomNav';

interface Props {
  breakpoint: Breakpoint;
  tab: LabTab;
  onTab: (t: LabTab) => void;
  collapsed: boolean;
  onToggle: () => void;
  experiment: ReactNode;
  variables: ReactNode;
  run: ReactNode;
  actions: ReactNode;
  viz: ReactNode;
  inspector: ReactNode;
  values: ReactNode;
  log: ReactNode;
  history: ReactNode;
}

export function Layout(p: Props) {
  if (p.breakpoint === 'wide') {
    return (
      <div className="layout wide">
        <aside className="col left">
          {p.experiment}
          {p.variables}
        </aside>
        <main className="col center">
          {p.actions}
          {p.run}
          {p.viz}
        </main>
        <aside className="col right">
          {p.inspector}
          {p.values}
        </aside>
        <footer className="col bottom">{p.log}</footer>
      </div>
    );
  }
  if (p.breakpoint === 'medium') {
    return (
      <div className="layout medium">
        <aside className={`col aux${p.collapsed ? ' collapsed' : ''}`}>
          <button className="aux-toggle" onClick={p.onToggle}>
            {p.collapsed ? '展开面板' : '收起面板'}
          </button>
          {!p.collapsed && (
            <>
              {p.experiment}
              {p.variables}
            </>
          )}
        </aside>
        <main className="col main">
          {p.actions}
          {p.run}
          {p.viz}
          {p.values}
          {p.inspector}
        </main>
        <footer className="col bottom">{p.log}</footer>
      </div>
    );
  }
  return (
    <div className="layout compact">
      <div className="compact-scroll">
        {p.tab === 'monitor' && (
          <>
            {p.actions}
            {p.run}
            {p.viz}
            {p.values}
            {p.inspector}
          </>
        )}
        {p.tab === 'experiment' && (
          <>
            {p.experiment}
            {p.variables}
          </>
        )}
        {p.tab === 'log' && p.log}
        {p.tab === 'history' && p.history}
      </div>
      <BottomNav tab={p.tab} onTab={p.onTab} />
    </div>
  );
}
