# XYLab · File Tree（审计位 · 空间地图）

回答「现在这个项目到底长什么样」。本文件是**当前有效空间地图**；BATCH-2 / STAT-1 之前的详细快照原 blob 归档于 [docs/audit/file-tree-pre-batch-stat.md](docs/audit/file-tree-pre-batch-stat.md)。

```text
XYLab/
├─ changelog.md                         ← 审计位 · 当前时间轴；历史归档见 docs/audit/
├─ file-tree.md                         ← 审计位 · 当前空间地图
├─ README.md
├─ package.json                         ← verify = governance → typecheck → test
├─ package-lock.json
├─ tsconfig.json
├─ vite.config.ts
├─ index.html
├─ manifest.webmanifest                 ← PWA manifest
├─ sw.js                                ← PWA service worker
│
├─ .github/workflows/pages.yml          ← CI verify/build + dist artifact + Pages deploy
│
├─ docs/
│  ├─ experiment-protocol-0.1.md        ← 人类可读协议合同
│  ├─ experiment-json-guide.md          ← JSON 编写/字段/错误指南
│  ├─ requirements/
│  │  └─ runtime-speed-and-run-count-2026-08-14.md
│  ├─ governance/
│  │  └─ XYLab-Development-Constitution.md ← 一体 · 开发宪法
│  ├─ acceptance/
│  │  └─ batch-stat-acceptance-2026-08-15.md ← BATCH-2 + STAT-1 用户真机证据
│  └─ audit/
│     ├─ changelog-through-2026-08-14.md ← 旧 changelog 原 blob 冻结归档
│     └─ file-tree-pre-batch-stat.md     ← 旧 file-tree 原 blob 冻结归档
│
├─ schema/
│  └─ experiment.schema.json            ← xylab-experiment@0.1；BATCH-2 向后兼容增加可选 batch
│
├─ examples/
│  ├─ fatigue-basic.json
│  └─ battle-metrics.json
│
├─ knowledge/                           ← 经验位
│  ├─ README.md
│  ├─ decisions/
│  │  ├─ loader-trust-boundary.md
│  │  ├─ runtime-state-machine.md
│  │  ├─ run-loop-cancellation.md
│  │  ├─ tick-batch-commit.md
│  │  ├─ seeded-random.md
│  │  ├─ monitoring-observer-only.md
│  │  ├─ event-edge-trigger.md
│  │  ├─ ui-responsive-shell.md
│  │  ├─ r2-light-consumer-workbench.md
│  │  ├─ xyui-consumer-intake.md
│  │  ├─ f2-monitoring-ui-close.md
│  │  ├─ ua1-visualization-picker.md
│  │  ├─ batch-experiment-v1.md         ← Batch Runner V1 决策
│  │  ├─ batch-json-generator-v2.md     ← BATCH-2 JSON 方案生成/序列化决策
│  │  └─ runtime-statistics-v1.md       ← STAT-1 Tick-only/Welford/N-1 决策
│  ├─ patterns/test-dir-layering.md
│  └─ pitfalls/
│     ├─ ajv-strictRequired-if-then.md
│     ├─ float-assertions.md
│     └─ vite-dev-ipv4-bind.md
│
├─ scripts/
│  └─ governance-guard.mjs              ← 底线位：5 + 100 自动门；SRP 人工门
│
├─ vendor/xyui/                         ← XYUI Core Pack 只读 UI 权威
│  ├─ UPSTREAM-PIN.json
│  ├─ packs/core-0.1/
│  ├─ registry/foundation/
│  ├─ tokens/architecture/
│  ├─ specs/XYUI1~8/
│  └─ audit/cross-audit.md
│
├─ public/                              ← PWA icons/assets
│
├─ src/
│  ├─ protocol/                         ← JSON 唯一可信边界
│  │  ├─ loader.ts                     ← Parse → Schema → Semantic → Normalize
│  │  ├─ validator.ts
│  │  ├─ loader-types.ts
│  │  ├─ raw-types.ts
│  │  ├─ types.ts                      ← ExperimentDefinition 可信合同
│  │  ├─ normalize/
│  │  ├─ semantic/
│  │  ├─ batch/                        ← BATCH-2 协议扩展
│  │  │  ├─ types.ts                  ← BatchDefinition/Dimension/Value
│  │  │  ├─ normalize.ts              ← raw batch → trusted batch
│  │  │  └─ semantic.ts               ← 变量/类型/range/重复/<=1000 语义校验
│  │  └─ serialize/
│  │     └─ index.ts                  ← trusted Definition → Loader-valid 外部 JSON
│  │
│  ├─ expression/                      ← Tokenizer → Parser → Semantic → Evaluator
│  │  ├─ token.ts
│  │  ├─ lexical-rules.ts
│  │  ├─ tokenizer.ts
│  │  ├─ errors.ts
│  │  ├─ syntax/
│  │  ├─ semantic/
│  │  └─ evaluation/
│  │
│  ├─ runtime/                         ← 可变状态/确定性 Tick；不依赖 UI
│  │  ├─ types.ts
│  │  ├─ create-runtime-state.ts
│  │  ├─ state.ts
│  │  ├─ random/prng.ts               ← seeded mulberry32；禁 Math.random
│  │  ├─ tick/                        ← snapshot evaluate + atomic commit
│  │  └─ controller/                  ← 六态控制/loop/speed/observer
│  │
│  ├─ monitor/                         ← Observer Only；STAT-1 统计真值层
│  │  ├─ types.ts                     ← NumericStatistics 含 sampleStdDev
│  │  ├─ registry.ts
│  │  ├─ accumulators.ts              ← BoundedSeries + Welford；初始点不计样本
│  │  ├─ events.ts
│  │  └─ session.ts                   ← Series 保留 initial；Statistics 只 record Tick
│  │
│  └─ ui/                              ← React/XYUI 消费层
│     ├─ main.tsx                     ← styles + visualization/history/batch/feedback CSS
│     ├─ App.tsx
│     ├─ styles.css
│     ├─ format.ts
│     ├─ viewState.ts
│     ├─ theme/
│     ├─ shell/
│     ├─ icons/
│     ├─ experiment/
│     │  ├─ parse.ts
│     │  ├─ draft.ts
│     │  ├─ ExperimentPanel.tsx       ← Load/Open/Example/Clear/Restore + ActionFeedback
│     │  ├─ VariablesPanel.tsx
│     │  └─ VariableControl.tsx
│     ├─ actions/
│     │  ├─ clipboard.ts              ← shared copyText + external serializer
│     │  └─ ExperimentActions.tsx
│     ├─ feedback/
│     │  ├─ ActionFeedback.tsx        ← XYUI-4 ordinary result feedback
│     │  ├─ ConfirmDialog.tsx         ← XYUI-7 destructive Compact Confirm
│     │  └─ feedback.css
│     ├─ batch/
│     │  ├─ BatchPanel.tsx            ← 手工/JSON 两模式、一键 Run All、copy/download feedback
│     │  ├─ ScenarioEditor.tsx
│     │  ├─ runner.ts                 ← 每场景隔离复用同一 Runtime
│     │  ├─ types.ts                  ← scenario/batch result export
│     │  ├─ batch.css
│     │  └─ generator/
│     │     ├─ expand.ts              ← dimensions → deterministic Cartesian scenarios
│     │     └─ BatchPreview.tsx       ← JSON 方案预览
│     ├─ monitor/
│     │  ├─ useMonitor.ts
│     │  ├─ RunPanel.tsx
│     │  ├─ ValuesPanel.tsx           ← mean/σ/n Tick-only 展示
│     │  ├─ metricModel.ts            ← MonitorSnapshot → MetricRow 唯一模型
│     │  └─ EventLog.tsx
│     ├─ visualization/
│     ├─ viz/
│     │  ├─ catalog.ts
│     │  ├─ compat.ts
│     │  ├─ picker.tsx
│     │  ├─ VizHost.tsx               ← Scatter 直接消费 snapshot.statistics
│     │  └─ shared.ts
│     ├─ charts/
│     │  ├─ trend.tsx
│     │  ├─ bars.tsx
│     │  ├─ scatter.tsx               ← Tick-only X/Y 配对 + Mean/样本σ/半径
│     │  ├─ state.tsx
│     │  └─ misc.tsx
│     └─ history/
│
└─ tests/
   ├─ governance/governance-guard.test.ts
   ├─ loader/
   │  ├─ batch-json.test.ts           ← BATCH-2 Loader/range/limit
   │  └─ r2-01-*.test.ts
   ├─ runtime/
   ├─ expression/
   ├─ monitor/
   │  ├─ r3-watch-series.test.ts      ← STAT-1 Tick-only 合同回归
   │  ├─ r3-statistics.test.ts        ← Welford / N-1 / reset / bounded history
   │  ├─ r3-events.test.ts
   │  ├─ r3-lifecycle.test.ts
   │  └─ r3-determinism.test.ts
   └─ ui/
      ├─ batch/
      │  ├─ batch-runner.test.ts      ← Batch 隔离 + STAT-1 export
      │  └─ batch-generator.test.ts   ← JSON dimensions deterministic expand
      ├─ r2/r2-json-roundtrip.test.ts ← external serializer round-trip
      ├─ f2/
      ├─ ua1/
      ├─ r1-monitor-bridge.test.ts
      └─ r1-monitor-projection.test.ts
```

## 职责边界速查

| 问题 | 唯一责任位置 |
| --- | --- |
| JSON 进哪里？ | `src/protocol/loader.ts` |
| JSON Batch 谁校验？ | `src/protocol/batch/`；Loader 前语义校验，场景总数上限 1000 |
| JSON Batch 谁生成方案？ | `src/ui/batch/generator/expand.ts`，只做确定性展开，不执行模拟 |
| Batch 谁执行？ | `src/ui/batch/runner.ts`，每场景隔离复用正式 Runtime/Monitor |
| 复制“可再次运行”的 JSON 谁负责？ | `src/protocol/serialize/index.ts`；`clipboard.ts` 只负责复制传输 |
| 运行时状态在哪？ | `src/runtime/` |
| 统计真值在哪？ | `src/monitor/accumulators.ts` + `session.ts`；UI 禁止另造轴统计 |
| 1000 发为什么等于 N=1000？ | Series 的 initial 独立保留；Statistics 只 record 1000 个成功 Tick |
| Scatter 统计从哪来？ | Mean/σ 读取 `MonitorSnapshot.statistics`；二维半径从 Tick-only pair 派生 |
| UI 设计依据在哪？ | `vendor/xyui/` 只读权威；BATCH/STAT 继续消费 XYUI-4/7/8 |
| CRUD 反馈在哪？ | `src/ui/feedback/` + 各 action 调用方；普通成功不弹 Modal，危险删除才 Confirm |
| 底线怎么守？ | `npm run verify`：governance → typecheck → test；5+100 + SRP |
| 历史审计去哪找？ | `docs/audit/` 原 blob 归档；当前状态看根 `changelog.md` / `file-tree.md` |
