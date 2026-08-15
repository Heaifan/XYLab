// BATCH-3 · JSON 方案预览：Sweep 显示实验组，Matrix 显示组合方案；不建立第二套编辑器。
import type { ExperimentDefinition } from '../../../protocol/types';
import type { BatchScenario } from '../types';
import { dimensionValues } from './expand';
interface Props { definition: ExperimentDefinition; scenarios: BatchScenario[]; }
export function BatchPreview({ definition, scenarios }: Props) {
  if (!definition.batch) return null;
  if (definition.batch.mode === 'sweep') return <div className="batch-json-preview" role="status">
    <div><b>单因素实验组</b><span className="muted"> · {definition.batch.dimensions.length} 组 · {scenarios.length} 个唯一场景</span></div>
    <div className="batch-preview-groups">{definition.batch.dimensions.map((dimension) => {
      const variable = definition.variables[dimension.variable], values = dimensionValues(dimension);
      return <div className="batch-preview-group" key={dimension.variable}><b>{variable?.label ?? dimension.variable}影响 <span>{values.length}</span></b><div>{values.map((value, index) => <span key={`${String(value)}-${index}`}>{String(value)}{variable?.unit ?? ''}</span>)}</div></div>;
    })}</div>
  </div>;
  const shown = scenarios.slice(0, 6);
  return <div className="batch-json-preview" role="status">
    <div><b>Matrix 多因素组合</b><span className="muted"> · 将生成 {scenarios.length} 个方案</span></div>
    <div className="batch-preview-items">{shown.map((scenario) => <span key={scenario.id}>{scenario.name}</span>)}{scenarios.length > shown.length && <span>…另 {scenarios.length - shown.length} 个</span>}</div>
  </div>;
}
