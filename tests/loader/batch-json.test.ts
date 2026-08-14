// BATCH-2 · JSON Batch Loader：range/values/matrix 与安全门。
import { describe, expect, it } from 'vitest';
import { loadExperiment } from '../../src/protocol/loader';
import type { RawExperiment } from '../../src/protocol/raw-types';
import { base } from './fixtures';
function doc(): RawExperiment {
  const raw = base(); raw.variables = {
    distance_m: { type: 'number', value: 100 }, stance: { type: 'enum', value: 'prone', options: ['standing', 'prone'] },
  }; raw.formulas = [{ id: 'f', target: 'distance_m', expression: 'distance_m' }]; return raw;
}
describe('BATCH-2 · JSON batch loader', () => {
  it('range + values 多维合法并规范化 tick_limit', () => {
    const raw = doc(); raw.batch = { tick_limit: 1000, dimensions: [
      { variable: 'distance_m', range: { start: 100, end: 500, step: 100 } },
      { variable: 'stance', values: ['standing', 'prone'] },
    ] };
    const r = loadExperiment(raw); expect(r.ok).toBe(true); if (!r.ok) return;
    expect(r.definition.batch?.tickLimit).toBe(1000); expect(r.definition.batch?.dimensions).toHaveLength(2);
  });
  it('未知变量、重复变量与非法 enum value 明确失败', () => {
    const raw = doc(); raw.batch = { dimensions: [
      { variable: 'missing', values: [1] }, { variable: 'stance', values: ['bad'] }, { variable: 'stance', values: ['prone'] },
    ] };
    const r = loadExperiment(raw); expect(r.ok).toBe(false); if (r.ok) return;
    expect(r.errors.map((e) => e.code)).toEqual(expect.arrayContaining(['BATCH_VARIABLE_NOT_FOUND', 'BATCH_VALUE_INVALID', 'BATCH_VARIABLE_DUPLICATE']));
  });
  it('range 不能用于 enum，integer range 必须保持整数', () => {
    const raw = doc(); raw.variables!.shots = { type: 'integer', value: 1 }; raw.batch = { dimensions: [
      { variable: 'stance', range: { start: 1, end: 2, step: 1 } }, { variable: 'shots', range: { start: 1, end: 3, step: 0.5 } },
    ] };
    const r = loadExperiment(raw); expect(r.ok).toBe(false); if (r.ok) return;
    expect(r.errors.filter((e) => e.code === 'BATCH_RANGE_INVALID')).toHaveLength(2);
  });
  it('笛卡尔积超过 1000 在 Loader 阻止运行', () => {
    const raw = doc(); raw.batch = { dimensions: [
      { variable: 'distance_m', values: Array.from({ length: 32 }, (_, i) => i + 1) },
      { variable: 'stance', values: Array.from({ length: 32 }, (_, i) => i % 2 ? 'standing' : 'prone') },
    ] };
    const r = loadExperiment(raw); expect(r.ok).toBe(false); if (r.ok) return;
    expect(r.errors.some((e) => e.code === 'BATCH_SCENARIO_LIMIT_EXCEEDED')).toBe(true);
  });
});
