// R2-02 · Definition → Runtime 初始化。
// RS-01/RS-04：绝不复用 Definition 内部对象引用 —— structuredClone 深复制，
// 防 Entity state 这类嵌套结构被 Runtime 修改后反向污染 Definition。
// 本轮只保证 Runtime ↔ Definition 深度隔离；「Runtime ↔ 读取者」隔离留给 Runtime API 成型后设计（不过度工程化）。

import type { ExperimentDefinition } from '../protocol/types';
import type { RuntimeEntity, RuntimeState, RuntimeValue } from './types';

export function createRuntimeState(definition: ExperimentDefinition): RuntimeState {
  const variables: Record<string, RuntimeValue> = {};
  for (const [name, v] of Object.entries(definition.variables)) {
    variables[name] = structuredClone(v.value); // 原始值（number/boolean/string）深度隔离
  }

  const entities: Record<string, RuntimeEntity> = {};
  for (const e of definition.entities) {
    entities[e.id] = { id: e.id, state: structuredClone(e.state) };
  }

  return {
    status: 'ready', // 本轮唯一实际产生的状态；状态切换属于 R2-05
    time: 0, // 冻结：第一个 Tick 之后才变为 tick（影响事件日志/曲线时间轴）
    tickIndex: 0,
    variables,
    entities,
    metadata: {
      experimentId: definition.experiment.id,
      schemaVersion: definition.schemaVersion,
    },
  };
}
