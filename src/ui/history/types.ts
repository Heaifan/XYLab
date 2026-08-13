// FE-A-R2 · Saved Run V1 数据合同。
// Definition 必须 Snapshot —— 否则以后不知道这组结果是哪套公式/参数跑出来的。
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';

export interface SavedRun {
  runId: string;
  runNumber: number;
  savedAt: number;
  experimentId: string;
  experimentName: string;
  definitionSnapshot: ExperimentDefinition;
  runtimeStatus: string;
  time: number;
  tickIndex: number;
  monitorSnapshot: MonitorSnapshot;
  note: string;
}
