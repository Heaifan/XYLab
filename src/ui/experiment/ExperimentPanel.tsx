// 实验加载面板：粘贴/文件/示例 + 一键清空与恢复当前实验 JSON。
import { useRef, useState } from 'react';
import { parseExperimentText } from './parse';
import type { ExperimentDefinition } from '../../protocol/types';
import example from '../../../examples/fatigue-basic.json';

interface Props { onLoaded: (definition: ExperimentDefinition) => void; definition: ExperimentDefinition | null; }

export function ExperimentPanel({ onLoaded, definition }: Props) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  function load(raw: string) {
    const result = parseExperimentText(raw);
    if (result.ok) { setErrors([]); onLoaded(result.definition); }
    else setErrors(result.errors);
  }
  function openFile(file: File) {
    file.text().then((raw) => { setText(raw); load(raw); }).catch((e: unknown) => setErrors([`读取文件失败：${String(e)}`]));
  }
  function clearJson() { setText(''); setErrors([]); }
  function restoreJson() {
    if (!definition) return;
    setText(JSON.stringify(definition, null, 2));
    setErrors([]);
  }
  return (
    <section className="panel">
      <h2>实验</h2>
      {definition && <div className="exp-head"><div className="exp-name">{definition.experiment.name}</div>
        {definition.experiment.description && <div className="exp-desc">{definition.experiment.description}</div>}</div>}
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="粘贴 Experiment JSON…" rows={8} spellCheck={false} />
      <div className="row">
        <button onClick={() => load(text)} disabled={text.trim() === ''}>加载 JSON</button>
        <button onClick={() => fileRef.current?.click()}>Open JSON</button>
        <button onClick={() => { const raw = JSON.stringify(example, null, 2); setText(raw); load(raw); }}>加载内置示例</button>
        <button onClick={clearJson} disabled={text === ''}>清空 JSON</button>
        <button onClick={restoreJson} disabled={!definition}>恢复当前实验</button>
      </div>
      <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => {
        const f = e.target.files?.[0]; if (f) openFile(f); e.target.value = '';
      }} />
      {errors.length > 0 && <ul className="errors">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
    </section>
  );
}
