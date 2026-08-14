// 实验加载面板：JSON 读取/恢复/清空均提供 XYUI-4 明确反馈。
import { useRef, useState } from 'react';
import type { ExperimentDefinition } from '../../protocol/types';
import example from '../../../examples/fatigue-basic.json';
import { definitionJson } from '../actions/clipboard';
import { ActionFeedback, type FeedbackState } from '../feedback/ActionFeedback';
import { parseExperimentText } from './parse';
interface Props { onLoaded: (definition: ExperimentDefinition) => void; definition: ExperimentDefinition | null; }
export function ExperimentPanel({ onLoaded, definition }: Props) {
  const [text, setText] = useState(''), [errors, setErrors] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null); const fileRef = useRef<HTMLInputElement>(null);
  function note(textValue: string, ok = true) { setFeedback({ text: textValue, ok }); window.setTimeout(() => setFeedback(null), 2200); }
  function load(raw: string, source = 'JSON') {
    const result = parseExperimentText(raw);
    if (result.ok) { setErrors([]); onLoaded(result.definition); note(`${source} 已加载`); }
    else { setErrors(result.errors); note(`${source} 加载失败`, false); }
  }
  function openFile(file: File) {
    file.text().then((raw) => { setText(raw); load(raw, '文件'); }).catch((e: unknown) => {
      setErrors([`读取文件失败：${String(e)}`]); note('文件读取失败', false);
    });
  }
  function clearJson() { setText(''); setErrors([]); note('JSON 输入已清空'); }
  function restoreJson() {
    if (!definition) return; setText(definitionJson(definition)); setErrors([]); note('已恢复当前可运行 JSON');
  }
  return <section className="panel">
    <h2>实验</h2>
    {definition && <div className="exp-head"><div className="exp-name">{definition.experiment.name}</div>{definition.experiment.description && <div className="exp-desc">{definition.experiment.description}</div>}</div>}
    <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="粘贴 Experiment JSON…" rows={8} spellCheck={false} />
    <div className="row">
      <button onClick={() => load(text)} disabled={text.trim() === ''}>加载 JSON</button>
      <button onClick={() => fileRef.current?.click()}>Open JSON</button>
      <button onClick={() => { const raw = JSON.stringify(example, null, 2); setText(raw); load(raw, '内置示例'); }}>加载内置示例</button>
      <button onClick={clearJson} disabled={text === ''}>清空 JSON</button>
      <button onClick={restoreJson} disabled={!definition}>恢复当前实验</button>
    </div>
    <ActionFeedback feedback={feedback} />
    <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) openFile(f); e.target.value = ''; }} />
    {errors.length > 0 && <ul className="errors">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
  </section>;
}
