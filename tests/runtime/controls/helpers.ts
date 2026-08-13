// R2-05BC 测试共享工具（非 test 文件）。
import { createController } from '../../../src/runtime/controller/controller';
import type { Scheduler } from '../../../src/runtime/controller/loop';
import { makeTickDef } from '../fixtures';

// 瞬时调度：loop 直接以微任务跑完（completed/failed 自动停，不等待现实时间）
export function instantScheduler(): Scheduler {
  return { sleep: () => Promise.resolve() };
}

// 手动调度：每次 sleep 挂起一个 wait，测试用 release() 精确控制 loop 苏醒时机
export function manualScheduler() {
  const waits: Array<() => void> = [];
  return {
    scheduler: { sleep: () => new Promise<void>((resolve) => waits.push(resolve)) } as Scheduler,
    release: (n = 1) => {
      for (let i = 0; i < n; i++) waits.shift()?.();
    },
    pending: () => waits.length,
  };
}

export function makeControls(opts: Parameters<typeof makeTickDef>[0], scheduler?: Scheduler) {
  const def = makeTickDef(opts);
  return { def, ctrl: createController(def, { scheduler }) };
}

// 排水：每轮 release 一个挂起的 sleep 并让出事件循环，直到 loop 终止
export async function drain(ctrl: { status: string }, m: { release: (n?: number) => void }) {
  while (ctrl.status === 'running') {
    m.release();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
  }
}
