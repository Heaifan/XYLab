// Governance 专项测试：Guard 自身与全库合规性回归，防止未来破线。
import { describe, expect, it } from 'vitest';
import { lineCount, scanProject } from '../../scripts/governance-guard.mjs';

describe('Governance Guard · 底线位回归', () => {
  it('G-100 全部手写源码（src/tests/scripts）≤ 100 行', () => {
    const { files, problems } = scanProject();
    const over = files.map((f) => `${f}:${lineCount(f)}`).filter((s) => Number(s.split(':')[1]) > 100);
    expect(over).toEqual([]);
    expect(problems.filter((p) => p.startsWith('[100]'))).toEqual([]);
  });

  it('G-5 职责目录 ≤ 5 个实现文件', () => {
    const { problems } = scanProject();
    expect(problems.filter((p) => p.startsWith('[5]'))).toEqual([]);
  });

  it('G-own Guard 脚本自身 ≤ 100 行', () => {
    expect(lineCount('scripts/governance-guard.mjs')).toBeLessThanOrEqual(100);
  });
});
