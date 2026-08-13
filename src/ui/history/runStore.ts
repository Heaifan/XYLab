// FE-A-R2 · Run 持久化 V1：Browser localStorage（不加库）。storage 可注入以便测试；
// 成功/失败明确：写入成功 → 明确提示；Storage/Quota Error → 明确失败，绝不假装保存成功。
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import type { SavedRun } from './types';

export const RUNS_KEY = 'xylab.runs.v1';

export interface RunStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Definition 必须 Snapshot —— 否则以后不知道这组结果是哪套公式/参数跑出来的。
export function buildRun(
  definition: ExperimentDefinition, snap: MonitorSnapshot, runtimeStatus: string,
  time: number, tickIndex: number, runNumber: number, note: string, savedAt: number
): SavedRun {
  return {
    runId: `run-${savedAt}-${runNumber}`, runNumber, savedAt,
    experimentId: definition.experiment.id, experimentName: definition.experiment.name,
    definitionSnapshot: definition, runtimeStatus, time, tickIndex,
    monitorSnapshot: snap, note,
  };
}

export function loadRuns(storage: RunStorage): SavedRun[] {
  try {
    const raw = storage.getItem(RUNS_KEY);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as SavedRun[]) : [];
  } catch {
    return [];
  }
}

export function saveRun(storage: RunStorage, run: SavedRun): { ok: true } | { ok: false; error: string } {
  try {
    storage.setItem(RUNS_KEY, JSON.stringify([run, ...loadRuns(storage)]));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function nextRunNumber(runs: SavedRun[]): number {
  return runs.reduce((m, r) => Math.max(m, r.runNumber), 0) + 1;
}

export function runLabel(n: number): string {
  return `Run #${String(n).padStart(3, '0')}`;
}

export function sortRuns(runs: SavedRun[]): SavedRun[] {
  return [...runs].sort((a, b) => b.savedAt - a.savedAt);
}

// file:// WebView / 隐私模式 / 存储被禁时，访问 window.localStorage 本身即抛——
// 探测失败降级内存 storage（Run 历史随页面关闭丢失，但应用可用，绝不白屏）。
const mem: Record<string, string> = {};
const memStore: RunStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = v;
  },
};

export function safeStorage(): RunStorage {
  try {
    const s = window.localStorage;
    s.getItem(RUNS_KEY);
    return s;
  } catch {
    return memStore;
  }
}
