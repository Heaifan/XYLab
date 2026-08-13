// R4-F1 · 顶栏：标题 + 实验名称/描述（控制操作已下沉运行区）。
import type { ExperimentDefinition } from '../../protocol/types';

export function TopBar({ definition }: { definition: ExperimentDefinition | null }) {
  return (
    <header className="topbar">
      <h1>XYLab</h1>
      {definition && (
        <div className="exp-title">
          <span className="exp-name">{definition.experiment.name}</span>
          {definition.experiment.description && <span className="exp-desc">{definition.experiment.description}</span>}
        </div>
      )}
    </header>
  );
}
