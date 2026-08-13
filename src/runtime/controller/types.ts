// R2-05A · Controller 结果类型（Step 与 Reset 的权威输出）。

import type { RuntimeStatus } from '../types';
import type { TickError, TickResult } from '../tick/types';

export type StepOutcome =
  | { ok: true; status: 'paused' | 'completed'; result: TickResult | null }
  | { ok: false; code: 'ILLEGAL_TRANSITION'; message: string; status: RuntimeStatus }
  | { ok: false; code: 'TICK_FAILED'; error: TickError; status: 'failed' };
