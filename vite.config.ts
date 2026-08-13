// UI-F1 · Vite 配置：React 插件 + 相对 base（静态部署友好）。
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
});
