// Batch Experiment V1 · XYUI 紧凑方案编辑器：一个方案可覆盖多个变量。
import type { ExperimentDefinition } from '../../protocol/types';
import type { RuntimeValue } from '../../runtime/types';
import { coerceVariableValue, type BatchScenario } from './types';

interface Props {
  definition: ExperimentDefinition;
  scenario: BatchScenario;
  baseline: boolean;
  disabled: boolean;
  onChange: (next: BatchScenario) => void;
  onBaseline: () => void;
  onRemove: () => void;
}

export function ScenarioEditor(p: Props) {
  const names = Object.keys(p.definition.variables);
  const used = Object.keys(p.scenario.overrides);
  function rename(name: string) { p.onChange({ ...p.scenario, name }); }
  function addOverride() {
    const key = names.find((n) => !used.includes(n));
    if (!key) return;
    p.onChange({ ...p.scenario, overrides: { ...p.scenario.overrides, [key]: p.definition.variables[key].value } });
  }
  function changeKey(oldKey: string, newKey: string) {
    const overrides = { ...p.scenario.overrides };
    delete overrides[oldKey];
    overrides[newKey] = p.definition.variables[newKey].value;
    p.onChange({ ...p.scenario, overrides });
  }
  function changeValue(key: string, raw: string) {
    const value: RuntimeValue = coerceVariableValue(p.definition, key, raw);
    p.onChange({ ...p.scenario, overrides: { ...p.scenario.overrides, [key]: value } });
  }
  function removeOverride(key: string) {
    const overrides = { ...p.scenario.overrides }; delete overrides[key];
    p.onChange({ ...p.scenario, overrides });
  }
  function valueEditor(key: string) {
    const def = p.definition.variables[key];
    const value = String(p.scenario.overrides[key]);
    if (def.type === 'boolean') return <select value={value} disabled={p.disabled} onChange={(e) => changeValue(key, e.target.value)}><option value="true">true</option><option value="false">false</option></select>;
    if (def.type === 'enum') return <select value={value} disabled={p.disabled} onChange={(e) => changeValue(key, e.target.value)}>{(def.options ?? []).map((o) => <option key={String(o)} value={String(o)}>{String(o)}</option>)}</select>;
    return <input type={def.type === 'number' || def.type === 'integer' ? 'number' : 'text'} value={value} disabled={p.disabled} onChange={(e) => changeValue(key, e.target.value)} />;
  }
  return (
    <div className={`batch-card${p.baseline ? ' baseline' : ''}`}>
      <div className="batch-card-head">
        <input type="text" value={p.scenario.name} disabled={p.disabled} onChange={(e) => rename(e.target.value)} aria-label="方案名称" />
        <button className={p.baseline ? 'primary' : ''} disabled={p.disabled} onClick={p.onBaseline}>{p.baseline ? '基准' : '设为基准'}</button>
        <button disabled={p.disabled} onClick={p.onRemove}>删除</button>
      </div>
      {used.map((key) => (
        <div className="batch-override" key={key}>
          <select value={key} disabled={p.disabled} onChange={(e) => changeKey(key, e.target.value)}>
            {names.map((n) => <option key={n} value={n} disabled={used.includes(n) && n !== key}>{p.definition.variables[n].label}</option>)}
          </select>
          {valueEditor(key)}
          <button disabled={p.disabled} onClick={() => removeOverride(key)}>移除</button>
        </div>
      ))}
      <button className="batch-add" disabled={p.disabled || used.length >= names.length} onClick={addOverride}>+ 添加变量覆盖</button>
    </div>
  );
}
