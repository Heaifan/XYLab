// UI-F1 · 实验加载面板：粘贴 JSON / 内置示例 / 错误展示。
import { useState } from 'react';
import { parseExperimentText } from './parse';
import type { ExperimentDefinition } from '../../protocol/types';
import example from '../../../examples/fatigue-basic.json';

interface Props {
  onLoaded: (definition: ExperimentDefinition) => void;
}

export function ExperimentPanel({ onLoaded }: Props) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  function load(raw: string) {
    const result = parseExperimentText(raw);
    if (result.ok) {
      setErrors([]);
      onLoaded(result.definition);
    } else {
      setErrors(result.errors);
    }
  }

  return (
    <section className="panel">
      <h2>实验</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴 Experiment JSON…"
        rows={10}
        spellCheck={false}
      />
      <div className="row">
        <button onClick={() => load(text)} disabled={text.trim() === ''}>
          加载 JSON
        </button>
        <button onClick={() => load(JSON.stringify(example))}>加载内置示例</button>
      </div>
      {errors.length > 0 && (
        <ul className="errors">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
