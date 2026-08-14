import { describe, expect, it } from 'vitest';
import type { ExperimentDefinition } from '../../../src/protocol/types';
import { runBatch, runBatchScenario } from '../../../src/ui/batch/runner';

const def: ExperimentDefinition = {
  schemaVersion: 'xylab-experiment@0.1',
  experiment: { id: 'batch-test', name: 'Batch Test' },
  variables: {
    rate: { name: 'rate', type: 'number', value: 1, label: '速率' },
    value: { name: 'value', type: 'number', value: 0, label: '结果' },
  },
  entities: [],
  formulas: [{ id: 'grow', target: 'value', expression: 'value + rate * dt' }],
  timeline: { mode: 'fixed_tick', tick: 1, duration: 10, totalTicks: 10 },
  watch: [{ target: 'value', mode: 'value' }],
  events: [],
  output: { summary: ['value'], charts: [] },
};

describe('Batch Experiment V1', () => {
  it('applies scenario overrides without mutating base definition', async () => {
    const result = await runBatchScenario(def, { id: 'b', name: 'B', overrides: { rate: 2 } }, 10);
    expect(result.status).toBe('completed');
    expect(result.values.value).toBe(20);
    expect(def.variables.rate.value).toBe(1);
  });

  it('runs isolated scenarios and returns results in scenario order', async () => {
    const results = await runBatch(def, [
      { id: 'a', name: 'A', overrides: { rate: 1 } },
      { id: 'b', name: 'B', overrides: { rate: 3 } },
    ], 5);
    expect(results.map((r) => r.scenarioId)).toEqual(['a', 'b']);
    expect(results.map((r) => r.values.value)).toEqual([5, 15]);
  });
});
