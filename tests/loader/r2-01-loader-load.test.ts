// R2-01 测试（加载）：T01~T03。目标类错误码见 loader-targets，类型类见 loader-semantic。
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadExperiment } from '../../src/protocol/loader';
import type { RawExperiment } from '../../src/protocol/raw-types';
import { base } from './fixtures';

const exampleJson = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../examples/fatigue-basic.json'),
  'utf-8',
);

describe('R2-01 Loader · 加载', () => {
  it('T01 合法 fatigue-basic → LOAD_SUCCESS', () => {
    const r = loadExperiment(exampleJson);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('预期加载成功');
    expect(r.definition.schemaVersion).toBe('xylab-experiment@0.1');
    expect(r.definition.experiment.id).toBe('fatigue-basic-001');
    expect(r.definition.timeline.totalTicks).toBe(600);
    expect(r.definition.variables.fatigue.label).toBe('疲劳度');
    expect(r.definition.events[0]?.level).toBe('warning');
  });

  it('T02 非法 JSON 字符串 → INVALID_JSON', () => {
    const r = loadExperiment('{not json');
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors[0]?.code).toBe('INVALID_JSON');
  });

  it('T03 Schema 非法 → SCHEMA_VALIDATION_FAILED（保留 path/keyword/message）', () => {
    const bad: RawExperiment = {
      schema: 'xylab-experiment@0.1',
      timeline: { mode: 'fixed_tick', tick: 1, duration: 10 },
      // 缺 experiment
    };
    const r = loadExperiment(bad);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('预期失败');
    expect(r.errors[0]?.code).toBe('SCHEMA_VALIDATION_FAILED');
    expect(r.errors[0]?.keyword).toBeTruthy();
    expect(r.errors[0]?.path).toBeTruthy();
    expect(r.errors[0]?.message).toBeTruthy();
  });
});
