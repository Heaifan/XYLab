# Runtime 状态机合同：六态 + Step/Reset 转换规则

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-13

## 背景

R2-05A 需要把「运行状态」做成权威合同。此前 RuntimeState.status 只有 'ready' 一个实际值，状态切换没有权威规则；Web/手机/桌面 UI 未来都要消费同一个状态机，规则必须现在冻结。

## 决策

**状态六态**（RuntimeStatus）：

```text
ready / running / paused / completed / stopped / failed
```

**05A 实际冻结的转换**（Step 与 Reset）：

```text
Step 仅允许：ready → paused/completed/failed
            paused → paused/completed/failed
Reset 无条件：任意状态 → ready（唯一完整重建路径）
```

**核心规则**：

1. **Step 只调用一次 R2-04 executeTick**——Controller 只组织 Tick Engine，绝不复制 Tick 逻辑；status 的唯一写入者是 Controller（落在 state.status，state == 唯一真相）。
2. **成功后按 canAdvance 判定**：还有下一完整 Tick → paused；否则 → completed。（canAdvance 提取为 tick.ts 导出的单一权威边界函数，executeTick 与 Controller 共用，禁止各自复制。）
3. **Tick 失败 → failed**：保存 lastError（code/message/formulaId/causeCode 保留到底层错误），variables/time/tickIndex 由 R2-04 原子性保证零变化。
4. **Reset = resetRuntimeState 完整重建**：time=0、tickIndex=0、ready、lastError=null，且是全新对象；Definition 永不修改。
5. **非法转换明确失败**：ILLEGAL_TRANSITION（不抛异常、返回 discriminated union，UI 可直接消费）。
6. **Stop ≠ Pause**：stopped 是终态（Reset 才可离开）；running/stopped 的调度（Pause/Resume/Stop）属 R2-05B，05A 只占位合同。

## 影响

- Web/手机/桌面 UI 只需消费 Controller（step/reset）与 state.status，无需各自维护状态。
- R2-05B Run Loop 建立在同一合同上：running 的进入/离开是 05B 的唯一新内容。
- R3 监控可直接按 status 决定采集行为（completed 后停止 watch 等）。

## 验证方式

A01~A18 全绿（195/195）：初始 ready、Step 单 Tick、paused 链、completed 边界（含非整除）、原子失败保留 State、lastError 保存与清除、Reset 重建、六态守卫表。
