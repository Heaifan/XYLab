// R4-F1 · 实验加载面板：粘贴 JSON / Open JSON（文件导入）/ 内置示例 / 名称描述头部 / 错误展示。
import { useRef, useState } from 'react';
import { parseExperimentText } from './parse';
import type { ExperimentDefinition } from '../../protocol/types';
import example from '../../../examples/fatigue-basic.json';

interface Props {
  onLoaded: (definition: ExperimentDefinition) => void;
  definition: ExperimentDefinition | null;
}

export function ExperimentPanel({ onLoaded, definition }: Props) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function load(raw: string) {
    const result = parseExperimentText(raw);
    if (result.ok) {
      setErrors([]);
      onLoaded(result.definition);
    } else {
      setErrors(result.errors);
    }
  }

  function openFile(file: File) {
    file
      .text()
      .then(load)
      .catch((e: unknown) => setErrors([`读取文件失败：${String(e)}`]));
  }

  return (
    <section className="panel">
      <h2>实验</h2>
      {definition && (
        <div className="exp-head">
          <div className="exp-name">{definition.experiment.name}</div>
          {definition.experiment.description && <div className="exp-desc">{definition.experiment.description}</div>}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴 Experiment JSON…"
        rows={8}
        spellCheck={false}
      />
      <div className="row">
        <button onClick={() => load(text)} disabled={text.trim() === ''}>
          加载 JSON
        </button>
        <button onClick={() => fileRef.current?.click()}>Open JSON</button>
        <button onClick={() => load(JSON.stringify(example))}>加载内置示例</button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) openFile(f);
          e.target.value = '';
        }}
      />
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
