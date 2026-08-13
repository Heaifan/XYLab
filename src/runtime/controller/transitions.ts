// R2-05A/05BC · 状态转换守卫。
// 冻结合同（05BC 完整版）：
//   Step:   ready/paused → paused/completed/failed
//   Run:    ready → running（同一 Controller 只允许一个 active loop）
//   Pause:  running → paused
//   Resume: paused → running（继续当前 state/time/tickIndex，绝不 Reset）
//   Stop:   running/paused → stopped（终态，仅 Reset 可离开）
//   Reset:  任意 → ready（唯一完整重建，并使一切旧循环永久失效）

import type { DeniedOutcome } from './types';
import type { RuntimeStatus } from '../types';

const STEP_ALLOWED: ReadonlySet<RuntimeStatus> = new Set(['ready', 'paused']);
const RUN_ALLOWED: ReadonlySet<RuntimeStatus> = new Set(['ready']);
const PAUSE_ALLOWED: ReadonlySet<RuntimeStatus> = new Set(['running']);
const RESUME_ALLOWED: ReadonlySet<RuntimeStatus> = new Set(['paused']);
const STOP_ALLOWED: ReadonlySet<RuntimeStatus> = new Set(['running', 'paused']);

const allows = (allowed: ReadonlySet<RuntimeStatus>, status: RuntimeStatus): boolean => allowed.has(status);

export const canStep = (s: RuntimeStatus): boolean => allows(STEP_ALLOWED, s);
export const canRun = (s: RuntimeStatus): boolean => allows(RUN_ALLOWED, s);
export const canPause = (s: RuntimeStatus): boolean => allows(PAUSE_ALLOWED, s);
export const canResume = (s: RuntimeStatus): boolean => allows(RESUME_ALLOWED, s);
export const canStop = (s: RuntimeStatus): boolean => allows(STOP_ALLOWED, s);

export function deniedOutcome(status: RuntimeStatus, action: string): DeniedOutcome {
  return { ok: false, code: 'INVALID_RUNTIME_TRANSITION', message: `当前状态 '${status}' 不允许 ${action}`, status };
}
