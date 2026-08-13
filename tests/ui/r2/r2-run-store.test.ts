// FE-A-R2 focused test：Run 持久化 V1（R2-T09~T14）。storage 可注入；成功/失败明确，不假装成功。
import { describe, expect, it } from 'vitest';
import { createMonitoredRuntime } from '../../../src/monitor/session';
import { buildRun, loadRuns, nextRunNumber, RUNS_KEY, runLabel, saveRun, sortRuns } from '../../../src/ui/history/runStore';
import type { RunStorage } from '../../../src/ui/history/runStore';
import { makeTickDef } from '../../runtime/fixtures';

class FakeStorage implements RunStorage {
  map = new Map<string, string>();
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
}

class QuotaStorage implements RunStorage {
  getItem() { return null; }
  setItem(): void { throw new Error('QuotaExceededError'); }
}

function fixtureRun(note: string, savedAt: number, runNumber: number) {
  const def = makeTickDef({
    variables: { b: { type: 'number', value: 1 } },
    formulas: [{ id: 'f', target: 'b', expression: 'b + 1' }],
    watch: [{ target: 'b', mode: 'value' }],
    tick: 1, duration: 5,
  });
  const rt = createMonitoredRuntime(def);
  rt.controller.step();
  return buildRun(def, rt.session.snapshot(), 'paused', 1, 1, runNumber, note, savedAt);
}

describe('FE-A-R2 · Run 持久化', () => {
  it('T09/T10：Save Run 包含 Definition Snapshot 与完整 MonitorSnapshot', () => {
    const run = fixtureRun('阈值偏早', 1000, 18);
    expect(run.definitionSnapshot.variables.b.value).toBe(1);
    expect(run.definitionSnapshot.formulas).toHaveLength(1);
    expect(run.monitorSnapshot.series.b.length).toBeGreaterThanOrEqual(2);
    expect(run.monitorSnapshot.statistics.b).toBeDefined();
    expect(run.runtimeStatus).toBe('paused');
    expect(run.time).toBe(1);
    expect(run.tickIndex).toBe(1);
    expect(run.note).toBe('阈值偏早');
  });
  it('T11/T12：Note round-trip 与刷新后仍存在（同一 storage 重新读取）', () => {
    const st = new FakeStorage();
    expect(saveRun(st, fixtureRun('第一条备注', 1000, 1))).toEqual({ ok: true });
    expect(saveRun(st, fixtureRun('第二条备注', 2000, 2))).toEqual({ ok: true });
    const reloaded = loadRuns(st); // 模拟刷新页面后重新加载
    expect(reloaded).toHaveLength(2);
    expect(reloaded.map((r) => r.note).sort()).toEqual(['第一条备注', '第二条备注'].sort());
  });
  it('T13：历史 newest first', () => {
    const st = new FakeStorage();
    saveRun(st, fixtureRun('旧', 1000, 1));
    saveRun(st, fixtureRun('新', 2000, 2));
    expect(sortRuns(loadRuns(st)).map((r) => r.savedAt)).toEqual([2000, 1000]);
    expect(loadRuns(st)[0].savedAt).toBe(2000); // 写入序本身即最新在前
  });
  it('T14：Quota/Storage 失败返回明确失败；损坏数据不崩溃', () => {
    const res = saveRun(new QuotaStorage(), fixtureRun('x', 1, 1));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('QuotaExceededError');
    expect(loadRuns(new QuotaStorage())).toEqual([]);
    const st = new FakeStorage();
    st.map.set(RUNS_KEY, '{corrupted');
    expect(loadRuns(st)).toEqual([]);
  });
  it('编号与标签：nextRunNumber 递增，runLabel 三位补零', () => {
    expect(nextRunNumber([])).toBe(1);
    expect(nextRunNumber([fixtureRun('a', 1, 17)])).toBe(18);
    expect(runLabel(18)).toBe('Run #018');
  });
});
