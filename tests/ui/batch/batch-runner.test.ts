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
  entities: [],
  formulas: [{ id: 'grow', target: 'value', expression: 'value + rate * dt' }],
  timeline: { mode: 'fixed_tick', tick: 1, duration: 10, totalTicks: 10 },
  watch: [{ target: 'value', mode: 'value' }],
  events: [],
  output: { summary: ['value'], charts: [{ x: 'time', y: 'value' }] },
  random: { seed: 7 },
};
const a = { id: 'a', name: 'A', overrides: { rate: 1 } };
const b = { id: 'b', name: 'B', overrides: { rate: 3 } };

describe('Batch Experiment V1-F1', () => {
  it('applies scenario overrides without mutating base definition', async () => {
    const result = await runBatchScenario(def, b, 10);
    expect(result.status).toBe('completed');
    expect(result.values.value).toBe(30);
    expect(def.variables.rate.value).toBe(1);
  });

  it('keeps the monitor snapshot for later visualization', async () => {
    const result = await runBatchScenario(def, a, 5);
    expect(result.snapshot.series.value.length).toBeGreaterThan(1);
    expect(result.snapshot.statistics.value.kind).toBe('numeric');
    expect(result.snapshot.session.tickCount).toBe(5);
  });

  it('runs isolated scenarios and returns results in scenario order', async () => {
    const results = await runBatch(def, [a, b], 5);
    expect(results.map((r) => r.scenarioId)).toEqual(['a', 'b']);
    expect(results.map((r) => r.values.value)).toEqual([5, 15]);
  });

  it('exports comparison JSON without embedding every time-series point', async () => {
    const results = await runBatch(def, [a, b], 5);
    const out = batchResultExport(def, [a, b], results, 'a', 5, 'value');
    expect(out.schemaVersion).toBe('xylab-batch-result@0.1');
    expect(out.scenarios[1].inputs.rate).toBe(3);
    expect(out.scenarios[1].summary.value).toBe(15);
    expect('series' in out.scenarios[1]).toBe(false);
  });

  it('exports one scenario with full series for external analysis', async () => {
    const result = await runBatchScenario(def, b, 5);
    const out = scenarioResultExport(def, b, result, 5);
    expect(out.schemaVersion).toBe('xylab-scenario-result@0.1');
    expect(out.series.value.length).toBeGreaterThan(1);
    expect(out.inputs.rate).toBe(3);
    expect(out.random).toEqual({ seed: 7 });
  });
});
