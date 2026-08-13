// R2-06 · 确定性 PRNG（mulberry32）。
// 正式 Runtime 禁止 Math.random：随机序列只由 seed 决定（同 seed ⇒ 同序列，可复现实验 Bug）。
// nextRandom 为纯函数：输入 uint32 状态，输出 [0,1) 值与下一状态。

export const DEFAULT_SEED = 1; // 实验未声明 random.seed 时使用（保持全局确定性）

export interface RandomDraw {
  value: number; // [0, 1)
  nextState: number; // uint32
}

export function nextRandom(state: number): RandomDraw {
  let a = state | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, nextState: a };
}
