// R4-F1 · 自动参数面板：草稿编辑 + 正式重建边界。
// 冻结：控件只写草稿（overrides），「应用并重新初始化」→ withInitialValues → 新 Controller；
// 禁止 React 直写模拟内部状态。运行中（非 ready）控件只读。
import type { Controller } from '../../runtime/controller/controller';
import type { ExperimentDefinition } from '../../protocol/types';
import { hasDraftChanges } from './draft';
import type { DraftOverrides } from './draft';
import { VariableControl } from './VariableControl';

interface Props {
  definition: ExperimentDefinition;
  controller: Controller;
  overrides: DraftOverrides;
  onOverride: (name: string, value: number | boolean | string) => void;
  onApply: () => void;
}

export function VariablesPanel({ definition, controller, overrides, onOverride, onApply }: Props) {
  const editable = controller.status === 'ready';
  const changed = hasDraftChanges(definition, overrides);

  return (
    <section className="panel">
      <h2>参数</h2>
      {Object.entries(definition.variables).length === 0 && <p className="muted">该实验没有变量。</p>}
      {Object.entries(definition.variables).map(([name, def]) => (
        <VariableControl
          key={name}
          name={name}
          def={def}
          value={overrides[name] !== undefined ? overrides[name] : controller.state.variables[name]}
          editable={editable}
          onChange={onOverride}
        />
      ))}
      <button disabled={!editable || !changed} onClick={onApply} title={changed ? '以当前参数重建 Runtime' : '没有未应用的修改'}>
        应用并重新初始化
      </button>
    </section>
  );
}
