// R4-F1 · 三模式响应式布局：Wide 左(实验/参数)中(运行区)右(当前值)底(日志)；
// Medium 双栏 + 辅助面板折叠；Compact 顶部运行条 + 页签（参数/当前值/日志）。
import type { ReactNode } from 'react';
import type { Breakpoint } from './breakpoints';

interface Props {
  breakpoint: Breakpoint;
  section: 'params' | 'values' | 'log';
  onSection: (s: 'params' | 'values' | 'log') => void;
  collapsed: boolean;
  onToggle: () => void;
  experiment: ReactNode;
  variables: ReactNode;
  run: ReactNode;
  values: ReactNode;
  log: ReactNode;
}

export function Layout({ breakpoint, section, onSection, collapsed, onToggle, experiment, variables, run, values, log }: Props) {
  if (breakpoint === 'wide') {
    return (
      <div className="layout wide">
        <aside className="col left">
          {experiment}
          {variables}
        </aside>
        <main className="col center">{run}</main>
        <aside className="col right">{values}</aside>
        <footer className="col bottom">{log}</footer>
      </div>
    );
  }
  if (breakpoint === 'medium') {
    return (
      <div className="layout medium">
        <aside className={`col aux${collapsed ? ' collapsed' : ''}`}>
          <button className="aux-toggle" onClick={onToggle}>
            {collapsed ? '▶ 面板' : '◀ 面板'}
          </button>
          {!collapsed && (
            <div className="aux-body">
              {experiment}
              {variables}
            </div>
          )}
        </aside>
        <main className="col main">
          {run}
          {values}
        </main>
        <footer className="col bottom">{log}</footer>
      </div>
    );
  }
  return (
    <div className="layout compact">
      <div className="col strip">{run}</div>
      <nav className="tabs">
        {(['params', 'values', 'log'] as const).map((s) => (
          <button key={s} className={section === s ? 'active' : ''} onClick={() => onSection(s)}>
            {s === 'params' ? '参数' : s === 'values' ? '当前值' : '日志'}
          </button>
        ))}
      </nav>
      {section === 'params' && (
        <div className="col">
          {experiment}
          {variables}
        </div>
      )}
      {section === 'values' && <div className="col">{values}</div>}
      {section === 'log' && <div className="col">{log}</div>}
    </div>
  );
}
