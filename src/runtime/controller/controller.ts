// R2-05BC · Runtime Controller（05A Step/Reset + 05BC 控制）。R3 起支持 TickObserver（纯输出投影）。
// 只组织 R2-04 Tick Engine（advance.tickOnce 单一推进点）；status 唯一写入者 = 本模块（state == 唯一真相）。

import { resetRuntimeState } from '../state';
import { tickOnce, toObservation } from './advance';
import { defaultScheduler, runLoop } from './loop';
import type { Scheduler } from './loop';
import type { ExperimentDefinition } from '../../protocol/types';
import type { RuntimeState } from '../types';
import type { ControlOutcome, RunResult, RunSpeed, StepOutcome, TickObserver } from './types';
import { canPause, canResume, canRun, canStep, canStop, deniedOutcome } from './transitions';

export interface ControllerOptions { scheduler?: Scheduler; observer?: TickObserver; }

export interface Controller {
  readonly definition: ExperimentDefinition;
  readonly state: RuntimeState;
  readonly status: RuntimeState['status'];
  readonly speed: RunSpeed;
  step(): StepOutcome;
  run(speed?: RunSpeed): RunResult;
  pause(): ControlOutcome;
  resume(): ControlOutcome;
  stop(): ControlOutcome;
  setSpeed(speed: RunSpeed): void;
  reset(): void;
}

export function createController(definition: ExperimentDefinition, options: ControllerOptions = {}): Controller {
  const { scheduler = defaultScheduler, observer } = options;
  let state: RuntimeState = resetRuntimeState(definition);
  let generation = 0; // 运行代际：Pause/Stop/Reset/新 Run/Resume 递增 → 旧循环永久失效
  let speed: RunSpeed = 'x1';

  const isCurrent = (gen: number): boolean => gen === generation && state.status === 'running';
  // 单一推进点：step 与 runLoop 共用；观察者只收投影（R3 合同：不得回写 Runtime）
  const advance = () => {
    const p = tickOnce(definition, state);
    if (observer) observer(toObservation(p, state));
    return p;
  };

  return {
    definition,
    get state() { return state; },
    get status() { return state.status; },
    get speed() { return speed; },
    step(): StepOutcome {
      if (!canStep(state.status)) {
        return deniedOutcome(state.status, 'Step（仅 ready/paused）');
      }
      const progress = advance();
      if (progress.status === 'advanced') {
        state.status = 'paused';
        return { ok: true, status: 'paused', result: progress.result };
      }
      if (progress.status === 'completed') {
        return { ok: true, status: 'completed', result: progress.result };
      }
      return { ok: false, code: 'TICK_FAILED', error: progress.error, status: 'failed' };
    },
    run(initial?: RunSpeed): RunResult {
      if (!canRun(state.status)) return deniedOutcome(state.status, 'Run（仅 ready；重复 Run 会产生双循环）');
      if (initial) speed = initial;
      generation += 1;
      const gen = generation;
      state.status = 'running';
      const done = runLoop({ isCurrent, tickOnce: advance }, gen, speed, definition.timeline.tick, scheduler);
      return { ok: true, status: 'running', done };
    },
    pause(): ControlOutcome {
      if (!canPause(state.status)) return deniedOutcome(state.status, 'Pause');
      generation += 1; // Pause 生效后不得产生新的尾随 Tick
      state.status = 'paused';
      return { ok: true, status: 'paused' };
    },
    resume(): ControlOutcome {
      if (!canResume(state.status)) return deniedOutcome(state.status, 'Resume');
      generation += 1;
      const gen = generation;
      state.status = 'running';
      void runLoop({ isCurrent, tickOnce: advance }, gen, speed, definition.timeline.tick, scheduler);
      return { ok: true, status: 'running' };
    },
    stop(): ControlOutcome {
      if (!canStop(state.status)) return deniedOutcome(state.status, 'Stop');
      generation += 1;
      state.status = 'stopped';
      return { ok: true, status: 'stopped' };
    },
    setSpeed(next: RunSpeed): void {
      speed = next;
    },
    reset(): void {
      generation += 1; // 旧循环即使苏醒也不得修改新 Runtime
      state = resetRuntimeState(definition);
    },
  };
}
