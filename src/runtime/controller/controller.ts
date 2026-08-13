// R2-05A · Runtime Controller（A3/A4/A5/A6）。
// 只组织 R2-04 Tick Engine，绝不复制 Tick 逻辑；status 的唯一写入者是本模块（落在 state.status，state == 唯一真相）。
// Reset = resetRuntimeState 完整重建（time=0 / tickIndex=0 / ready / lastError=null），Definition 永不修改。

import { resetRuntimeState } from '../state';
import { canAdvance, executeTick } from '../tick/tick';
import type { ExperimentDefinition } from '../../protocol/types';
import type { RuntimeState } from '../types';
import type { StepOutcome } from './types';
import { canStep } from './transitions';

export interface Controller {
  readonly definition: ExperimentDefinition;
  readonly state: RuntimeState;
  readonly status: RuntimeState['status'];
  step(): StepOutcome;
  reset(): void;
}

export function createController(definition: ExperimentDefinition): Controller {
  let state: RuntimeState = resetRuntimeState(definition);

  return {
    definition,
    get state() {
      return state;
    },
    get status() {
      return state.status;
    },
    step(): StepOutcome {
      if (!canStep(state.status)) {
        return {
          ok: false,
          code: 'ILLEGAL_TRANSITION',
          message: `当前状态 '${state.status}' 不允许 Step（仅 ready/paused 可 Step）`,
          status: state.status,
        };
      }

      const outcome = executeTick(definition, state); // 只调用一次 R2-04

      if (outcome.status === 'success') {
        state.status = canAdvance(definition, state) ? 'paused' : 'completed';
        return { ok: true, status: state.status, result: outcome.result };
      }

      if (outcome.status === 'duration-reached') {
        state.status = 'completed';
        return { ok: true, status: 'completed', result: null };
      }

      // 原子失败：state/time/tickIndex 由 R2-04 保证零变化，这里只落状态与错误
      state.status = 'failed';
      state.lastError = outcome.error;
      return { ok: false, code: 'TICK_FAILED', error: outcome.error, status: 'failed' };
    },
    reset(): void {
      state = resetRuntimeState(definition); // 全新对象
    },
  };
}
