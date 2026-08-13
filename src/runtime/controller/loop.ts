// R2-05BC · Run Loop：运行代际取消 + 批量 yield（Speed ≠ dt 铁律）。
// 冻结：同一 Controller 只允许一个 active loop；Pause/Stop/Reset/新 Run/Resume 通过 generation 递增使旧循环永久失效；
// 旧循环苏醒后先检查代际与状态，绝不修改新 Runtime（覆盖三个危险场景）。
// 速度只决定现实调度（batchSize/delayMs），dt 永远 = timeline.tick；
// MAX 批量执行并主动 yield（delay 0 也走 setTimeout），绝不阻塞事件循环。

import type { RunSpeed } from './types';
import type { TickProgress } from './advance';

export interface Scheduler {
  sleep(ms: number): Promise<void>;
}

export const defaultScheduler: Scheduler = {
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

export interface LoopContext {
  isCurrent(generation: number): boolean; // 代际匹配 && status === 'running'
  tickOnce(): TickProgress;
}

export function speedProfile(speed: RunSpeed, tickSeconds: number): { batchSize: number; delayMs: number } {
  switch (speed) {
    case 'x1':
      return { batchSize: 1, delayMs: tickSeconds * 1000 }; // 模拟时间 ≈ 现实时间
    case 'x10':
      return { batchSize: 10, delayMs: tickSeconds * 1000 };
    case 'x100':
      return { batchSize: 100, delayMs: tickSeconds * 1000 };
    case 'max':
      return { batchSize: 1000, delayMs: 0 }; // 尽可能快，但必须 yield
  }
}

export async function runLoop(
  ctx: LoopContext,
  generation: number,
  speed: RunSpeed,
  tickSeconds: number,
  scheduler: Scheduler,
): Promise<void> {
  const profile = speedProfile(speed, tickSeconds);
  let pending = 0;
  while (ctx.isCurrent(generation)) {
    const progress = ctx.tickOnce();
    if (progress.status !== 'advanced') return; // completed / failed 自动停止
    pending += 1;
    if (pending >= profile.batchSize) {
      pending = 0;
      await scheduler.sleep(profile.delayMs);
    }
  }
}
