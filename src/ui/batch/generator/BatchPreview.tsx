// BATCH-2 · JSON 方案预览；仅展示协议生成事实，不建立第二套编辑器。
import type { ExperimentDefinition } from '../../../protocol/types';
import type { BatchScenario } from '../types';
interface Props { definition: ExperimentDefinition; scenarios: BatchScenario[]; }
export function BatchPreview({ definition, scenarios }: Props) {
  if (!definition.batch) return null;
  const shown = scenarios.slice(0, 6);
  return <div className="batch-json-preview" role="status">
    <div><b>JSON 自动方案</b><span className="muted"> · 将生成 {scenarios.length} 个方案</span></div>
    <div className="batch-preview-items">
      {shown.map((scenario) => <span key={scenario.id}>{scenario.name}</span>)}
      {scenarios.length > shown.length && <span>…另 {scenarios.length - shown.length} 个</span>}
    </div>
  </div>;
}
