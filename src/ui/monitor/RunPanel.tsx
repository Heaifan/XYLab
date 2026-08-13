// R4-F1 · 运行区：状态/时间/Tick + 全部 Controller 操作（Wide/Medium 面板，Compact 顶部紧凑控制条）。
// Compact 主次层级（XYUI 主次规则）：Run/Pause/Resume + 速度直显；Step/Stop/Reset 收入「更多」。
// 按钮可用性由 transitions 守卫投影（UI 不做第二套状态判断）。
import { useState } from 'react';
import type { Controller } from '../../runtime/controller/controller';
import type { RunSpeed } from '../../runtime/controller/types';
import { canPause, canResume, canRun, canStep, canStop } from '../../runtime/controller/transitions';
import type { Breakpoint } from '../shell/breakpoints';
import type { MonitorSnapshot } from '../monitor/useMonitor';

const SPEEDS: RunSpeed[] = ['x1', 'x10', 'x100', 'max'];

interface Props {
  controller: Controller | null;
  snap: MonitorSnapshot;
  breakpoint: Breakpoint;
  refresh: () => void;
}

export function RunPanel({ controller, snap, breakpoint, refresh }: Props) {
  const [more, setMore] = useState(false);
  const st = controller ? controller.status : null;
  const compact = breakpoint === 'compact';

  function act(fn: () => unknown) {
    fn();
    refresh();
  }

  const primary = (
    <>
      <button disabled={st === null || !canRun(st)} onClick={() => act(() => controller!.run())}>
        ▶ Run
      </button>
      <button disabled={st === null || !canPause(st)} onClick={() => act(() => controller!.pause())}>
        ⏸ Pause
      </button>
      <button disabled={st === null || !canResume(st)} onClick={() => act(() => controller!.resume())}>
        ▶ Resume
      </button>
      <select
        value={controller?.speed ?? 'x1'}
        disabled={st === null}
        onChange={(e) => act(() => controller!.setSpeed(e.target.value as RunSpeed))}
        aria-label="速度档"
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s === 'max' ? 'MAX' : s}
          </option>
        ))}
      </select>
    </>
  );

  const secondary = (
    <>
      <button disabled={st === null || !canStep(st)} onClick={() => act(() => controller!.step())}>
        → Step
      </button>
      <button disabled={st === null || !canStop(st)} onClick={() => act(() => controller!.stop())}>
        ■ Stop
      </button>
      <button disabled={st === null} onClick={() => act(() => controller!.reset())}>
        ↺ Reset
      </button>
    </>
  );

  return (
    <section className="panel run-panel">
      <div className="stats">
        <span>
          时间 <b>{snap.time}</b>
        </span>
        <span>
          Tick <b>{snap.tickIndex}</b>
        </span>
        <span className={`status status-${st ?? '—'}`}>{st ?? '—'}</span>
        {snap.lastError && <span className="error-banner">{snap.lastError}</span>}
      </div>
      <div className="row controls">
        {primary}
        {compact ? (
          <button onClick={() => setMore(!more)}>{more ? '收起' : '更多'}</button>
        ) : (
          secondary
        )}
      </div>
      {compact && more && <div className="row controls">{secondary}</div>}
    </section>
  );
}
