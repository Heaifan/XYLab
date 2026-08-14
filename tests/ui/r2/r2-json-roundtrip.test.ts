// BATCH-2 · “复制/恢复当前 JSON”必须仍是 Loader 可读取的外部协议文档。
import { describe, expect, it } from 'vitest';
import { loadExperiment } from '../../../src/protocol/loader';
import { definitionJson } from '../../../src/ui/actions/clipboard';
describe('BATCH-2 · external JSON round-trip', () => {
  it('内部字段不会泄漏，batch/tick_limit 可往返', () => {
    const first = loadExperiment({ schema: 'xylab-experiment@0.1', experiment: { id: 'roundtrip', name: '往返' },
      variables: { distance_m: { type: 'number', value: 100, label: '距离' } },
      formulas: [{ id: 'f', target: 'distance_m', expression: 'distance_m' }], timeline: { mode: 'fixed_tick', tick: 1, duration: 2 },
      batch: { tick_limit: 1000, dimensions: [{ variable: 'distance_m', range: { start: 100, end: 500, step: 100 } }] } });
    expect(first.ok).toBe(true); if (!first.ok) return;
    const text = definitionJson(first.definition); const raw = JSON.parse(text);
    expect(raw.schema).toBe('xylab-experiment@0.1'); expect(raw.schemaVersion).toBeUndefined();
    expect(raw.variables.distance_m.name).toBeUndefined(); expect(raw.timeline.totalTicks).toBeUndefined(); expect(raw.batch.tick_limit).toBe(1000);
    const second = loadExperiment(text); expect(second.ok).toBe(true); if (!second.ok) return;
    expect(second.definition.batch?.dimensions[0].range?.end).toBe(500);
  });
});
