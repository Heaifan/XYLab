// R2-04 · 单次确定性 Tick 编排（T1/T5）。
// 管道：duration boundary → duplicate target 检查 → Snapshot 批量求值 → 原子提交 → 时间推进。
// 冻结语义：任一公式失败 → 整个 Tick 原子失败（state / time / tickIndex 零变化）；
// 无 partial final tick（下一完整 Tick 将超过 duration 则不执行）；
// 运行循环（Run N ticks / Pause / Step）属 R2-05，本层只做单 Tick。

import type { ExperimentDefinition } from '../../protocol/types';
import type { RuntimeState } from '../types';
import type { TickError, TickOutcome } from './types';
import { evaluateFormulaBatch } from './evaluate-batch';
import { commitBatch } from './commit';

const EPS = 1e-9;

export function executeTick(definition: ExperimentDefinition, state: RuntimeState): TickOutcome {
  const tick = definition.timeline.tick;

  // Duration boundary（整数 tick 数已由 Loader 保证；直接构造的定义由时间比较兜底）
  if (state.tickIndex >= definition.timeline.totalTicks || state.time + tick > definition.timeline.duration + EPS) {
    return { status: 'duration-reached', time: state.time, tickIndex: state.tickIndex };
  }

  // 重复 target 硬拒绝（无顺序依赖、无后写覆盖）
  const dup = findDuplicateTarget(definition);
  if (dup) {
    const error: TickError = {
      code: 'DUPLICATE_FORMULA_TARGET',
      message: `target '${dup.target}' 被多个公式写入（重复出现于 formula '${dup.id}'）`,
      formulaId: dup.id,
      target: dup.target,
    };
    return { status: 'failed', error, time: state.time, tickIndex: state.tickIndex };
  }

  // Snapshot Read → Evaluate All
  const batch = evaluateFormulaBatch(definition, state);
  if (batch.error) {
    return { status: 'failed', error: batch.error, time: state.time, tickIndex: state.tickIndex };
  }

  // Batch Commit（先全量校验后应用，原子）
  const committed = commitBatch(definition, state, batch.writes);
  if ('error' in committed) {
    return { status: 'failed', error: committed.error, time: state.time, tickIndex: state.tickIndex };
  }

  // 时间推进
  const previousTime = state.time;
  const previousTickIndex = state.tickIndex;
  state.time = previousTime + tick;
  state.tickIndex = previousTickIndex + 1;

  return {
    status: 'success',
    result: {
      previousTime,
      currentTime: state.time,
      previousTickIndex,
      currentTickIndex: state.tickIndex,
      changes: committed.changes,
      state,
    },
  };
}

function findDuplicateTarget(definition: ExperimentDefinition): { id: string; target: string } | null {
  const seen = new Set<string>();
  for (const f of definition.formulas) {
    if (seen.has(f.target)) return { id: f.id, target: f.target };
    seen.add(f.target);
  }
  return null;
}
