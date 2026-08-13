// UI-F1 · 顶栏：标题 + 状态徽章 + 运行控制（Run/Pause/Resume/Step/Stop/Reset）+ 速度档。
// 按钮可用性由 transitions 守卫决定（UI 只投影，不做第二套状态判断）。
import type { Controller } from '../../runtime/controller/controller';
import type { RunSpeed } from '../../runtime/controller/types';
import { canPause, canResume, canRun, canStep, canStop } from '../../runtime/controller/transitions';

const SPEEDS: RunSpeed[] = ['x1', 'x10', 'x100', 'max'];

interface Props {
  controller: Controller | null;
  refresh: () => void;
}

export function TopBar({ controller, refresh }: Props) {
  const st = controller ? controller.status : null;
  const enabled = controller !== null;

  function act(fn: () => unknown) {
    fn();
    refresh();
  }

  return (
    <header className="topbar">
      <h1>XYLab</h1>
      <span className={`status status-${st ?? '—'}`}>{st ?? '—'}</span>
      <div className="row controls">
        <button disabled={st === null || !canRun(st)} onClick={() => act(() => controller!.run())}>
          ▶ Run
        </button>
        <button disabled={st === null || !canPause(st)} onClick={() => act(() => controller!.pause())}>
          ⏸ Pause
        </button>
        <button disabled={st === null || !canResume(st)} onClick={() => act(() => controller!.resume())}>
          ▶ Resume
        </button>
        <button disabled={st === null || !canStep(st)} onClick={() => act(() => controller!.step())}>
          → Step
        </button>
        <button disabled={st === null || !canStop(st)} onClick={() => act(() => controller!.stop())}>
          ■ Stop
        </button>
        <button disabled={!enabled} onClick={() => act(() => controller!.reset())}>
          ↺ Reset
        </button>
        <select
          value={controller?.speed ?? 'x1'}
          disabled={!enabled}
          onChange={(e) => act(() => controller!.setSpeed(e.target.value as RunSpeed))}
          aria-label="速度档"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s === 'max' ? 'MAX' : s}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
