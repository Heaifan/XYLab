# Windows 下 vite dev 默认只监听 IPv6（[::1]），浏览器/curl 连 127.0.0.1 被拒

- 类别：pitfalls
- 入库条件：④ 可重复解决方法 + ⑤ 容易再次踩中的坑
- 日期：2026-08-13

## 现象

`npx vite --port 5173` 显示 "Local: http://localhost:5173/"，但：

```text
curl http://127.0.0.1:5173/ → 000（连接拒绝）
netstat 显示 LISTENING 仅在 [::1]:5173
Hermes 桌面端浏览器访问 localhost → ERR_CONNECTION_REFUSED
```

## 原因

Windows 上 vite 7 默认解析 localhost 优先绑到 IPv6 回环（[::1]）；git-bash 的 curl 与部分内嵌浏览器只走 IPv4 或对 ::1 代理处理异常。

## 解决

显式绑定 IPv4 并关闭 strictPort 歧义：

```bash
npx vite --port 5173 --strictPort --host 127.0.0.1
```

然后 `curl --noproxy '*' http://127.0.0.1:5173/` 应返回 HTTP 200。Hermes 桌面端 browser_navigate 也使用 `http://127.0.0.1:5173/` 而非 localhost。

## 附

浏览器端排查模板：`import('/src/ui/main.tsx?v=2')` 带 cache-busting 重导入 + window error listener 捕获真实堆栈（外部化模块错误如 node:fs 会显示 "Module \"node:fs\" has been externalized"）。
