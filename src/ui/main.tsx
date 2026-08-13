// UI-F1/FE-A-R2 · 入口。
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './visualization/visualization.css';
import './history/history.css';

createRoot(document.getElementById('root')!).render(<App />);
