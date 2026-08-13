// R2-02 · Runtime State 类型：与 ExperimentDefinition 彻底分离的「可变世界」。
// RS-01：Definition 运行期不可变；RS-02：只有 RuntimeState 允许变化。
// RS-05：本目录（runtime/）不依赖 React / DOM / UI，未来可复用于 Web / Desktop / Editor。

export type RuntimeStatus = 'ready' | 'running' | 'paused' | 'completed' | 'stopped' | 'failed';
// R2-05A 冻结六态：ready/running/paused/completed/stopped/failed；
// 05A 实际只产生 ready/paused/completed/failed，running/stopped 的调度属 R2-05B（合同已占位）。

export interface RuntimeFailure {
  code: string;
  message: string;
  formulaId?: string;
  target?: string;
  causeCode?: string;
  span?: { start: number; end: number };
}

export type RuntimeValue = number | boolean | string;

export interface RuntimeEntity {
  id: string;
  state: Record<string, number>; // 深复制自 Definition（RS-04）
}

export interface RuntimeMetadata {
  experimentId: string;
  schemaVersion: string;
  // 刻意不含 createdAt：任何真实时间戳都会破坏「相同 Definition ⇒ 相同初始 State」的确定性。
}

export interface RuntimeState {
  status: RuntimeStatus;
  lastError: RuntimeFailure | null; // R2-05A：Tick 失败时保存，Reset 清空
  time: number; // 模拟时间（秒）。冻结：初始 0，第一个 Tick 之后才变为 tick
  tickIndex: number; // 已执行 tick 数。冻结：初始 0
  variables: Record<string, RuntimeValue>; // 只存值，不复制 UI 定义（label/min/max 留在 Definition）
  entities: Record<string, RuntimeEntity>; // ID 索引（Loader 已保证 id 唯一），不再数组扫描
  metadata: RuntimeMetadata;
}
