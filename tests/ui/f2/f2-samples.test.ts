// F2 验收样例取证：examples/*.json 必须经真实 Loader 加载成功；对战样例 = 12 watch、混单位（人/分/%/吨/m·s）。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadExperiment } from '../../../src/protocol/loader';

function load(name: string) {
  return loadExperiment(JSON.parse(readFileSync(join(process.cwd(), 'examples', name), 'utf8')));
}

describe('F2 · 验收样例', () => {
  it('fatigue-basic.json（单指标 Hello World）加载成功', () => {
    const r = load('fatigue-basic.json');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.definition.watch.length).toBe(1);
  });
  it('battle-metrics.json（多指标对战）加载成功：12 watch、混单位、含 threshold 与 boolean', () => {
    const r = load('battle-metrics.json');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.definition.watch.length).toBe(12);
    const units = new Set(r.definition.watch.map((w) => r.definition.variables[w.target]?.unit ?? ''));
    expect(units.size).toBeGreaterThanOrEqual(4);
    expect(r.definition.watch.some((w) => w.mode === 'threshold')).toBe(true);
    expect(r.definition.watch.some((w) => r.definition.variables[w.target]?.type === 'boolean')).toBe(true);
  });
});
