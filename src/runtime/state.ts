// R2-02 · Reset 基础能力（RS-03 可复现）。
// Reset = 从不可变 Definition 重新创建初始状态：State A == State B，且是新对象。

import { createRuntimeState } from './create-runtime-state';
import type { ExperimentDefinition } from '../protocol/types';
import type { RuntimeState } from './types';

export function resetRuntimeState(definition: ExperimentDefinition): RuntimeState {
  return createRuntimeState(definition);
}
