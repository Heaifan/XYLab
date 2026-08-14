// 运行区：状态/时间/Tick + 动态速度 + 本轮模拟次数。
import { useState } from 'react';
import { canPause, canResume, canRun, canStep, canStop } from '../../runtime/controller/transitions';
import type { RunSpeed } from '../../runtime/controller/types';
import type { Breakpoint } from '../shell/breakpoints';
import { IconPause, IconPlay, IconReset, IconResume, IconStepForward, IconStop } from '../icons/Icons';
import type { MonitorBridge, MonitoredRuntime } from './useMonitor';

const SPEEDS: RunSpeed[] = ['x1', 'x10', 'x100', 'max'];
interface Props { runtime: MonitoredRuntime | null; bridge: MonitorBridge; breakpoint: Breakpoint; refresh: () => void; }

export function RunPanel({ runtime, bridge, breakpoint, refresh }: Props) {
  const [more, setMore] = useState(false);
  const st = runtime ? runtime.controller.status : null;
  const compact = breakpoint === 'compact';
  const total = runtime?.controller.definition.timeline.totalTicks ?? 1;
  const [count, setCount] = useState(total);
  function act(fn: () => unknown) { fn(); refresh(); }
  function applyCount(raw: number) {
    const next = Math.max(1, Math.min(total, Math.floor(raw || 1)));
    setCount(next);
    runtime?.controller.setTickLimit(next);
  }

  const primary = <>
    <button disabled={st === null || !canRun(st)} onClick={() => act(() => runtime!.controller.run())}><IconPlay /> Run</button>
    <button disabled={st === null || !canPause(st)} onClick={() => act(() => runtime!.controller.pause())}><IconPause /> Pause</button>
    <button disabled={st === null || !canResume(st)} onClick={() => act(() => runtime!.controller.resume())}><IconResume /> Resume</button>
    <select value={runtime?.controller.speed ?? 'x1'} disabled={st === null}
      onChange={(e) => act(() => runtime!.controller.setSpeed(e.target.value as RunSpeed))} aria-label="速度档">
      {SPEEDS.map((s) => <option key={s} value={s}>{s === 'max' ? 'MAX' : s}</option>)}
    </select>
  </>;
  const secondary = <>
    <button disabled={st === null || !canStep(st)} onClick={() => act(() => runtime!.controller.step())}><IconStepForward /> Step</button>
    <button disabled={st === null || !canStop(st)} onClick={() => act(() => runtime!.controller.stop())}><IconStop /> Stop</button>
    <button disabled={runtime === null} onClick={() => act(() => runtime!.reset())}><IconReset /> Reset</button>
  </>;

  return <section className="panel run-panel">
    <div className="stats">
      <span>时间 <b>{bridge.time}</b></span><span>Tick <b>{bridge.tickIndex}</b></span>
      <span className={`status status-${st ?? '—'}`}>{st ?? '—'}</span>
      {bridge.lastError && <span className="error-banner">{bridge.lastError}</span>}
    </div>
    <div className="row controls">{primary}{compact ? <button onClick={() => setMore(!more)}>{more ? '收起' : '更多'}</button> : secondary}</div>
    <div className="row controls run-count">
      <label htmlFor="run-count">模拟次数</label>
      <input id="run-count" type="number" inputMode="numeric" min={1} max={total} step={1} value={count}
        disabled={!runtime || st === 'running'} onChange={(e) => applyCount(Number(e.target.value))} />
      <button disabled={!runtime || st === 'running'} onClick={() => applyCount(100)}>100</button>
      <button disabled={!runtime || st === 'running'} onClick={() => applyCount(1000)}>1000</button>
      <span className="muted">上限 {total}</span>
    </div>
    {compact && more && <div className="row controls">{secondary}</div>}
  </section>;
}
