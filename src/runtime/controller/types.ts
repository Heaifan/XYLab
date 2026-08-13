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

// R3 · Tick 观察（纯输出投影）：Controller 每执行一个 Tick（step/runLoop）后同步回调。
// Monitoring 只消费本结构，绝不回写 Runtime——观察者存在与否不得改变模拟结果。
export interface TickObservation {
  status: 'advanced' | 'completed' | 'failed';
  result: TickResult | null; // failed 时为 null（成功 Tick 含 changes）
  error: TickError | null; // 仅 failed 非空
  time: number; // Tick 执行后的模拟时间
  tickIndex: number;
  values: Record<string, number | boolean | string>; // Tick 后的变量快照（浅拷贝）
}

export type TickObserver = (observation: TickObservation) => void;
