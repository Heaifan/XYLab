import { describe, expect, it } from 'vitest';
import type { ExperimentDefinition } from '../../../src/protocol/types';
import { runBatch, runBatchScenario } from '../../../src/ui/batch/runner';
import { batchResultExport, scenarioResultExport } from '../../../src/ui/batch/types';

const def: ExperimentDefinition = {
  schemaVersion: 'xylab-experiment@0.1',
  experiment: { id: 'batch-test', name: 'Batch Test' },
  variables: {
    rate: { name: 'rate', type: 'number', value: 1, label: '速率', unit: 'm/s' },
    value: { name: 'value', type: 'number', value: 0, label: '结果', unit: 'm' },
  },
  entities: [], formulas: [{ id: 'grow', target: 'value', expression: 'value + rate * dt' }],
  timeline: { mode: 'fixed_tick', tick: 1, duration: 10, totalTicks: 10 },
  watch: [{ target: 'value', mode: 'value' }], events: [],
  output: { summary: ['value'], charts: [{ x: 'time', y: 'value' }] }, random: { seed: 7 },
};
const a = { id: 'a', name: 'A', overrides: { rate: 1 } };
const b = { id: 'b', name: 'B', overrides: { rate: 3 } };

describe('Batch Experiment BATCH-2 + STAT-1', () => {
  it('applies scenario overrides without mutating base definition', async () => {
    const result = await runBatchScenario(def, b, 10);
    expect(result.status).toBe('completed'); expect(result.values.value).toBe(30); expect(def.variables.rate.value).toBe(1);
  });

  it('keeps Tick-only statistics for later visualization', async () => {
    const result = await runBatchScenario(def, a, 5), st = result.snapshot.statistics.value;
    expect(result.snapshot.series.value).toHaveLength(6); expect(result.snapshot.session.tickCount).toBe(5);
    if (st.kind !== 'numeric') throw new Error('expected numeric');
    expect(st.sampleCount).toBe(5); expect(st.average).toBe(3); expect(st.sampleStdDev).toBeCloseTo(Math.sqrt(2.5));
  });

  it('runs isolated scenarios and returns results in scenario order', async () => {
    const results = await runBatch(def, [a, b], 5);
    expect(results.map((r) => r.scenarioId)).toEqual(['a', 'b']); expect(results.map((r) => r.values.value)).toEqual([5, 15]);
  });

  it('exports comparison JSON with STAT-1 but without every series point', async () => {
    const results = await runBatch(def, [a, b], 5), out = batchResultExport(def, [a, b], results, 'a', 5, 'value');
    expect(out.schemaVersion).toBe('xylab-batch-result@0.1'); expect(out.scenarios[1].inputs.rate).toBe(3);
    expect(out.scenarios[1].summary.value).toBe(15); expect('series' in out.scenarios[1]).toBe(false);
    const st = out.scenarios[0].statistics.value;
    if (st.kind !== 'numeric') throw new Error('expected numeric');
    expect(st.sampleCount).toBe(5); expect(st.sampleStdDev).toBeCloseTo(Math.sqrt(2.5));
  });

  it('exports one scenario with full series and statistics', async () => {
    const result = await runBatchScenario(def, b, 5), out = scenarioResultExport(def, b, result, 5);
    expect(out.schemaVersion).toBe('xylab-scenario-result@0.1'); expect(out.series.value).toHaveLength(6);
    expect(out.inputs.rate).toBe(3); expect(out.random).toEqual({ seed: 7 });
    const st = out.statistics.value;
    if (st.kind !== 'numeric') throw new Error('expected numeric');
    expect(st.sampleCount).toBe(5);
  });
});
