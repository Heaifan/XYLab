// UI-F1 · 单变量控件：number→滑杆+数值框；integer→数值框（仅整数）；boolean→开关；enum→下拉；string→文本框。
import type { VariableDefinition } from '../../protocol/types';

interface Props {
  name: string;
  def: VariableDefinition;
  value: unknown;
  editable: boolean;
  onChange: (name: string, value: number | boolean | string) => void;
}

export function VariableControl({ name, def, value, editable, onChange }: Props) {
  const label = `${def.label}${def.unit ? ` (${def.unit})` : ''}`;

  if (def.type === 'number') {
    const min = def.min ?? 0;
    const max = def.max ?? 100;
    const step = def.step ?? 1;
    return (
      <label className="var">
        <span>{label}</span>
        <div className="row">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={Number(value)}
            disabled={!editable}
            onChange={(e) => onChange(name, Number(e.target.value))}
          />
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number(value)}
            disabled={!editable}
            onChange={(e) => onChange(name, Number(e.target.value))}
          />
        </div>
      </label>
    );
  }
  if (def.type === 'integer') {
    return (
      <label className="var">
        <span>{label}</span>
        <input
          type="number"
          step={1}
          value={Number(value)}
          disabled={!editable}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isInteger(n)) onChange(name, n);
          }}
        />
      </label>
    );
  }
  if (def.type === 'boolean') {
    return (
      <label className="var">
        <span>{label}</span>
        <input type="checkbox" checked={Boolean(value)} disabled={!editable} onChange={(e) => onChange(name, e.target.checked)} />
      </label>
    );
  }
  if (def.type === 'enum') {
    const options = (def.options ?? []) as Array<string | number>;
    return (
      <label className="var">
        <span>{label}</span>
        <select value={String(value)} disabled={!editable} onChange={(e) => onChange(name, e.target.value)}>
          {options.map((o) => (
            <option key={String(o)} value={String(o)}>
              {String(o)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="var">
      <span>{label}</span>
      <input type="text" value={String(value)} disabled={!editable} onChange={(e) => onChange(name, e.target.value)} />
    </label>
  );
}
