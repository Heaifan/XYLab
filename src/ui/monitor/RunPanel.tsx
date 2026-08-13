// F2 · 运行区：状态/时间/Tick + 全部 Controller 操作（Wide/Medium 面板，Compact 顶部紧凑控制条）。
// 行为权威 = Controller（Start/Pause/Resume/Stop/Speed/守卫）；Reset = handle.reset()（Runtime + MonitorSession 联合重置）。
// 图标 = F2 内联 SVG（Foundation.Icon 冻结风格；glyph 注册表 GAP 权宜），Icon+Text，禁 Unicode 符号。
// Compact 主次层级（XYUI 主次规则）：Run/Pause/Resume + 速度直显；Step/Stop/Reset 收入「更多」。
import { useState } from 'react';
import { canPause, canResume, canRun, canStep, canStop } from '../../runtime/controller/transitions';
import type { RunSpeed } from '../../runtime/controller/types';
import type { Breakpoint } from '../shell/breakpoints';
import { IconPause, IconPlay, IconReset, IconResume, IconStepForward, IconStop } from '../icons/Icons';
import type { MonitorBridge, MonitoredRuntime } from './useMonitor';

const SPEEDS: RunSpeed[] = ['x1', 'x10', 'x100', 'max'];

interface Props {
  runtime: MonitoredRuntime | null;
  bridge: MonitorBridge;
  breakpoint: Breakpoint;
  refresh: () => void;
}

export function RunPanel({ runtime, bridge, breakpoint, refresh }: Props) {
  const [more, setMore] = useState(false);
  const st = runtime ? runtime.controller.status : null;
  const compact = breakpoint === 'compact';

  function act(fn: () => unknown) {
    fn();
    refresh();
  }

  const primary = (
    <>
      <button disabled={st === null || !canRun(st)} onClick={() => act(() => runtime!.controller.run())}>
        <IconPlay /> Run
      </button>
      <button disabled={st === null || !canPause(st)} onClick={() => act(() => runtime!.controller.pause())}>
        <IconPause /> Pause
      </button>
      <button disabled={st === null || !canResume(st)} onClick={() => act(() => runtime!.controller.resume())}>
        <IconResume /> Resume
      </button>
      <select
        value={runtime?.controller.speed ?? 'x1'}
        disabled={st === null}
        onChange={(e) => act(() => runtime!.controller.setSpeed(e.target.value as RunSpeed))}
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
      <button disabled={st === null || !canStep(st)} onClick={() => act(() => runtime!.controller.step())}>
        <IconStepForward /> Step
      </button>
      <button disabled={st === null || !canStop(st)} onClick={() => act(() => runtime!.controller.stop())}>
        <IconStop /> Stop
      </button>
      <button disabled={runtime === null} onClick={() => act(() => runtime!.reset())} title="Runtime 与 MonitorSession 联合重置">
        <IconReset /> Reset
      </button>
    </>
  );

  return (
    <section className="panel run-panel">
      <div className="stats">
        <span>
          时间 <b>{bridge.time}</b>
        </span>
        <span>
          Tick <b>{bridge.tickIndex}</b>
        </span>
        <span className={`status status-${st ?? '—'}`}>{st ?? '—'}</span>
        {bridge.lastError && <span className="error-banner">{bridge.lastError}</span>}
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
