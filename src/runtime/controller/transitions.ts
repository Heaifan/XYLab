// R2-05A · 状态转换守卫（A2）。
// 冻结合同：Step 仅允许 ready / paused；Reset 无条件允许（唯一完整重建路径）。
// running 的 Pause/Stop、paused 的 Resume 属 R2-05B 调度，05A 不实现但合同已占位。

import type { RuntimeStatus } from '../types';

const STEP_ALLOWED: ReadonlySet<RuntimeStatus> = new Set(['ready', 'paused']);

export function canStep(status: RuntimeStatus): boolean {
  return STEP_ALLOWED.has(status);
}
