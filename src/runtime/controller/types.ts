// R2-05BC · Controller 结果类型（控制与 Step 的权威输出）。

import type { RuntimeStatus } from '../types';
import type { TickError, TickResult } from '../tick/types';

export type RunSpeed = 'x1' | 'x10' | 'x100' | 'max'; // max 对应 UI 展示的 MAX

export type StepOutcome =
  | { ok: true; status: 'paused' | 'completed'; result: TickResult | null }
  | { ok: false; code: 'INVALID_RUNTIME_TRANSITION'; message: string; status: RuntimeStatus }
  | { ok: false; code: 'TICK_FAILED'; error: TickError; status: 'failed' };

export type ControlOutcome =
  | { ok: true; status: RuntimeStatus }
  | { ok: false; code: 'INVALID_RUNTIME_TRANSITION'; message: string; status: RuntimeStatus };

export type DeniedOutcome = { ok: false; code: 'INVALID_RUNTIME_TRANSITION'; message: string; status: RuntimeStatus };

export interface RunOk {
  ok: true;
  status: 'running';
  done: Promise<void>; // 循环终止（completed / failed / 被取消）时 resolve
}

export type RunResult =
  | RunOk
  | { ok: false; code: 'INVALID_RUNTIME_TRANSITION'; message: string; status: RuntimeStatus };
