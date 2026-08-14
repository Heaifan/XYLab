// UI-F1/FE-A-R2 · 入口。
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './visualization/visualization.css';
import './history/history.css';
import './batch/batch.css';

// 启动兜底：初始化异常必显可读信息，绝不留白屏（file:// WebView 等环境排查用）。
try {
  createRoot(document.getElementById('root')!).render(<App />);
} catch (e) {
  document.getElementById('root')!.textContent = `启动失败：${e instanceof Error ? e.message : String(e)}`;
}

// PWA：生产构建注册 Service Worker（离线缓存 + 可安装）；开发环境不注册。
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
