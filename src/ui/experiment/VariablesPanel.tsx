// UI-F1 · 自动参数面板：按变量类型生成控件（冻结映射，仅 ready 态可编辑）。
// 冻结：参数编辑 = ready 态直写 state.variables（R2-02 mutable 合同）；运行中只读。
import type { Controller } from '../../runtime/controller/controller';
import type { ExperimentDefinition } from '../../protocol/types';
import { VariableControl } from './VariableControl';

interface Props {
  definition: ExperimentDefinition;
  controller: Controller;
  forceRefresh: () => void;
}

export function VariablesPanel({ definition, controller, forceRefresh }: Props) {
  const editable = controller.status === 'ready';

  function setValue(name: string, value: number | boolean | string) {
    if (controller.status !== 'ready') return;
    controller.state.variables[name] = value;
    forceRefresh();
  }

  return (
    <section className="panel">
      <h2>参数</h2>
      {Object.entries(definition.variables).length === 0 && <p className="muted">该实验没有变量。</p>}
      {Object.entries(definition.variables).map(([name, def]) => (
        <VariableControl key={name} name={name} def={def} value={controller.state.variables[name]} editable={editable} onChange={setValue} />
      ))}
    </section>
  );
}
