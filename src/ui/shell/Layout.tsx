// UI-F1 · 三模式响应式布局容器：Wide 三栏+底日志；Medium 双栏+底日志；Compact 单栏+页签。
import type { ReactNode } from 'react';
import type { Breakpoint } from './breakpoints';

interface Props {
  breakpoint: Breakpoint;
  section: 'params' | 'monitor' | 'log';
  onSection: (s: 'params' | 'monitor' | 'log') => void;
  experiment: ReactNode;
  variables: ReactNode;
  monitor: ReactNode;
  log: ReactNode;
}

export function Layout({ breakpoint, section, onSection, experiment, variables, monitor, log }: Props) {
  if (breakpoint === 'wide') {
    return (
      <div className="layout wide">
        <aside className="col left">
          {experiment}
          {variables}
        </aside>
        <main className="col center">{monitor}</main>
        <footer className="col bottom">{log}</footer>
      </div>
    );
  }
  if (breakpoint === 'medium') {
    return (
      <div className="layout medium">
        <div className="col top">
          {experiment}
          {variables}
        </div>
        <div className="col center">{monitor}</div>
        <footer className="col bottom">{log}</footer>
      </div>
    );
  }
  return (
    <div className="layout compact">
      <nav className="tabs">
        {(['params', 'monitor', 'log'] as const).map((s) => (
          <button key={s} className={section === s ? 'active' : ''} onClick={() => onSection(s)}>
            {s === 'params' ? '参数' : s === 'monitor' ? '监控' : '日志'}
          </button>
        ))}
      </nav>
      {section === 'params' && (
        <div className="col">
          {experiment}
          {variables}
        </div>
      )}
      {section === 'monitor' && <div className="col">{monitor}</div>}
      {section === 'log' && <div className="col">{log}</div>}
    </div>
  );
}
