// R2-05BC · Runtime Controller：单一 Tick 推进、运行代际取消、动态速度与独立本轮模拟次数。
import { resetRuntimeState } from '../state';
import { tickOnce, toObservation, type TickProgress } from './advance';
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
  readonly tickLimit: number;
  step(): StepOutcome;
  run(speed?: RunSpeed): RunResult;
  pause(): ControlOutcome;
  resume(): ControlOutcome;
  stop(): ControlOutcome;
  setSpeed(speed: RunSpeed): void;
  setTickLimit(ticks: number): void;
  reset(): void;
}

export function createController(definition: ExperimentDefinition, options: ControllerOptions = {}): Controller {
  const { scheduler = defaultScheduler, observer } = options;
  let state: RuntimeState = resetRuntimeState(definition);
  let generation = 0;
  let speed: RunSpeed = 'x1';
  let tickLimit = definition.timeline.totalTicks;
  const isCurrent = (gen: number): boolean => gen === generation && state.status === 'running';
  const runDefinition = (): ExperimentDefinition => ({
    ...definition,
    timeline: { ...definition.timeline, duration: tickLimit * definition.timeline.tick, totalTicks: tickLimit },
  });
  const advance = (): TickProgress => {
    if (state.tickIndex >= tickLimit) {
      state.status = 'completed';
      const done: TickProgress = { status: 'completed', result: null };
      if (observer) observer(toObservation(done, state));
      return done;
    }
    const p = tickOnce(runDefinition(), state);
    if (observer) observer(toObservation(p, state));
    return p;
  };
  const launch = () => {
    generation += 1;
    const gen = generation;
    state.status = 'running';
    return runLoop({ isCurrent, tickOnce: advance }, gen, speed, definition.timeline.tick, scheduler);
  };

  return {
    definition,
    get state() { return state; },
    get status() { return state.status; },
    get speed() { return speed; },
    get tickLimit() { return tickLimit; },
    step(): StepOutcome {
      if (!canStep(state.status)) return deniedOutcome(state.status, 'Step（仅 ready/paused）');
      const p = advance();
      if (p.status === 'advanced') { state.status = 'paused'; return { ok: true, status: 'paused', result: p.result }; }
      if (p.status === 'completed') return { ok: true, status: 'completed', result: p.result };
      return { ok: false, code: 'TICK_FAILED', error: p.error, status: 'failed' };
    },
    run(initial?: RunSpeed): RunResult {
      if (!canRun(state.status)) return deniedOutcome(state.status, 'Run（仅 ready）');
      if (initial) speed = initial;
      return { ok: true, status: 'running', done: launch() };
    },
    pause(): ControlOutcome {
      if (!canPause(state.status)) return deniedOutcome(state.status, 'Pause');
      generation += 1; state.status = 'paused'; return { ok: true, status: 'paused' };
    },
    resume(): ControlOutcome {
      if (!canResume(state.status)) return deniedOutcome(state.status, 'Resume');
      void launch(); return { ok: true, status: 'running' };
    },
    stop(): ControlOutcome {
      if (!canStop(state.status)) return deniedOutcome(state.status, 'Stop');
      generation += 1; state.status = 'stopped'; return { ok: true, status: 'stopped' };
    },
    setSpeed(next: RunSpeed): void { speed = next; if (state.status === 'running') void launch(); },
    setTickLimit(ticks: number): void { if (Number.isSafeInteger(ticks) && ticks >= 1) tickLimit = ticks; },
    reset(): void { generation += 1; state = resetRuntimeState(definition); },
  };
}
