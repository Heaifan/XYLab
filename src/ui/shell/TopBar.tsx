// FE-A-R2 · 顶栏：品牌 + LIVE 状态/时间（状态文字+颜色双通道）+ 实验名/描述。
import type { ExperimentDefinition } from '../../protocol/types';

interface Props {
  definition: ExperimentDefinition | null;
  status: string | null;
  time: number;
}

export function TopBar({ definition, status, time }: Props) {
  return (
    <header className="topbar">
      <h1>XYLab</h1>
      {status && (
        <span className={`live live-${status}`}>
          <i className="live-dot" />
          {status === 'running' ? 'LIVE' : status} {Math.round(time)}s
        </span>
      )}
      {definition && (
        <div className="exp-title">
          <span className="exp-name">{definition.experiment.name}</span>
          {definition.experiment.description && <span className="exp-desc">{definition.experiment.description}</span>}
        </div>
      )}
    </header>
  );
}
