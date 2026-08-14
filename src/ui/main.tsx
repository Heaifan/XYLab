// UI-F1/FE-A-R2 · 入口。
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './visualization/visualization.css';
import './history/history.css';
import './batch/batch.css';
import './feedback/feedback.css';
try { createRoot(document.getElementById('root')!).render(<App />); }
catch (e) { document.getElementById('root')!.textContent = `启动失败：${e instanceof Error ? e.message : String(e)}`; }
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
