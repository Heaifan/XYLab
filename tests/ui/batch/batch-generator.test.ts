// BATCH-2 · JSON 方案展开：范围与笛卡尔积。
import { describe, expect, it } from 'vitest';
import { loadExperiment } from '../../../src/protocol/loader';
import { expandBatchScenarios } from '../../../src/ui/batch/generator/expand';
function definition(dimensions: unknown[]) {
  const r = loadExperiment({ schema: 'xylab-experiment@0.1', experiment: { id: 'batch-test', name: 'Batch' },
    variables: { distance_m: { type: 'number', value: 100, label: '距离', unit: 'm' }, stance: { type: 'enum', value: 'prone', options: ['standing', 'prone'], label: '姿态' } },
    formulas: [{ id: 'f', target: 'distance_m', expression: 'distance_m' }], timeline: { mode: 'fixed_tick', tick: 1, duration: 1 }, batch: { dimensions } });
  if (!r.ok) throw new Error(r.errors.map((e) => e.message).join('; ')); return r.definition;
}
describe('BATCH-2 · expandBatchScenarios', () => {
  it('100~500m/100 自动生成 5 个方案', () => {
    const rows = expandBatchScenarios(definition([{ variable: 'distance_m', range: { start: 100, end: 500, step: 100 } }]));
    expect(rows.map((r) => r.overrides.distance_m)).toEqual([100, 200, 300, 400, 500]);
    expect(rows[0].name).toBe('距离=100m');
  });
  it('range × values 自动生成稳定笛卡尔积', () => {
    const rows = expandBatchScenarios(definition([
      { variable: 'distance_m', values: [100, 300, 500] }, { variable: 'stance', values: ['standing', 'prone'] },
    ]));
    expect(rows).toHaveLength(6); expect(rows[0].overrides).toEqual({ distance_m: 100, stance: 'standing' });
    expect(rows[5].overrides).toEqual({ distance_m: 500, stance: 'prone' });
  });
});
