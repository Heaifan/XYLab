// R2-05BC · tickOnce：单 Tick 推进 + 状态落账（step 与 run loop 共用，禁止各自复制）。
// status/lastError 的落账收敛于此；state/time/tickIndex 的原子性由 R2-04 executeTick 保证。

import { canAdvance, executeTick } from '../tick/tick';
import type { ExperimentDefinition } from '../../protocol/types';
import type { RuntimeState } from '../types';
import type { TickError, TickResult } from '../tick/types';
import type { TickObservation } from './types';

export type TickProgress =
  | { status: 'advanced'; result: TickResult }
  | { status: 'completed'; result: TickResult | null }
  | { status: 'failed'; error: TickError };

// R3 · 观察投影：TickProgress + 执行后状态 → 不可变 TickObservation（values 浅拷贝，观察者不得回写）。
export function toObservation(progress: TickProgress, state: RuntimeState): TickObservation {
  const failed = progress.status === 'failed';
  return {
    status: progress.status,
    result: failed ? null : progress.result,
    error: failed ? progress.error : null,
    time: state.time,
    tickIndex: state.tickIndex,
    values: { ...state.variables },
  };
}

export function tickOnce(definition: ExperimentDefinition, state: RuntimeState): TickProgress {
  const outcome = executeTick(definition, state);

  if (outcome.status === 'success') {
    if (!canAdvance(definition, state)) {
      state.status = 'completed';
      return { status: 'completed', result: outcome.result };
    }
    return { status: 'advanced', result: outcome.result };
  }

  if (outcome.status === 'duration-reached') {
    state.status = 'completed';
    return { status: 'completed', result: null };
  }

  state.status = 'failed';
  state.lastError = outcome.error;
  return { status: 'failed', error: outcome.error };
}
