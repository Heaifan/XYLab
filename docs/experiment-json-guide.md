# XYLab 实验 JSON 编写指南

- 适用协议：`xylab-experiment@0.1`（R1 冻结，2026-08-13）
- 依据（均可在仓库核对）：`docs/experiment-protocol-0.1.md`（人类可读契约）、`schema/experiment.schema.json`（机器校验，draft-07 严格模式）、`examples/fatigue-basic.json`（Hello World 示例）
- 编写入口：XYLab 网页「实验」页签 → 粘贴 JSON 或 Open JSON 文件，加载器自动校验并生成参数面板

---

## 1. 仓库里已有的模板与说明

| 材料 | 位置 | 用途 |
| --- | --- | --- |
| 人类可读协议契约 | `docs/experiment-protocol-0.1.md` | 全部字段规则、错误码（§10）、演进规则 |
| JSON Schema（机器校验） | `schema/experiment.schema.json` | 加载器实际执行的严格校验（未知字段直接报错） |
| 官方示例 | `examples/fatigue-basic.json` | 可直接加载的 Hello World |

本文档是上述三者的**编写向速查总结**：给模板、给规则、给常见错误。

---

## 2. 最小模板（复制即用）

只有三个必填块：`schema`、`experiment`、`timeline`。下面这份是最小可运行实验：

```json
{
  "schema": "xylab-experiment@0.1",
  "experiment": {
    "id": "my-exp-001",
    "name": "我的第一个实验"
  },
  "variables": {
    "a": { "type": "number", "value": 10, "label": "数值 A" }
  },
  "formulas": [
    { "id": "grow", "target": "a", "expression": "a + 1 * dt" }
  ],
  "timeline": { "mode": "fixed_tick", "tick": 1, "duration": 100 },
  "watch": [
    { "target": "a", "mode": "value" }
  ],
  "output": {
    "summary": ["a"],
    "charts": [ { "x": "time", "y": "a" } ]
  }
}
```

跑完效果：`a` 从 10 每秒 +1，100 秒后 a = 110，曲线图与统计自动生成。

---

## 3. 完整模板（全部字段）

```json
{
  "schema": "xylab-experiment@0.1",
  "experiment": {
    "id": "fatigue-basic-001",
    "name": "步兵基础疲劳测试",
    "description": "测试持续行军时疲劳累积",
    "category": "movement",
    "version": "0.1.0",
    "tags": ["fatigue", "movement"],
    "author": "Heaifan"
  },
  "variables": {
    "move_speed":   { "type": "number",  "value": 5,    "min": 0, "max": 20,  "step": 0.1,  "unit": "m/s", "label": "移动速度" },
    "fatigue_rate": { "type": "number",  "value": 0.05, "min": 0, "max": 1,   "step": 0.01, "label": "疲劳增长系数" },
    "fatigue":      { "type": "number",  "value": 0,    "min": 0, "max": 100, "unit": "%",  "label": "疲劳度" },
    "march_count":  { "type": "integer", "value": 3,    "min": 0, "max": 10,  "label": "行军队数" },
    "enabled":      { "type": "boolean", "value": true, "label": "是否启用" },
    "stance":       { "type": "enum",    "value": "hold", "options": ["hold", "advance", "retreat"], "label": "姿态" },
    "note":         { "type": "string",  "value": "备注文本" }
  },
  "entities": [
    { "id": "unit-a", "name": "步兵 A", "type": "infantry", "state": { "hp": 100, "morale": 80 } }
  ],
  "formulas": [
    { "id": "fatigue-growth", "target": "fatigue", "expression": "fatigue + move_speed * fatigue_rate * dt" },
    { "id": "hp-drain",       "target": "unit-a.hp", "expression": "clamp(unit-a.hp - 2 * dt, 0, 100)" }
  ],
  "timeline": { "mode": "fixed_tick", "tick": 1, "duration": 600 },
  "watch": [
    { "target": "fatigue", "mode": "value" },
    { "target": "unit-a.morale", "mode": "change" },
    { "target": "fatigue", "mode": "threshold", "threshold": 70, "operator": ">=" }
  ],
  "events": [
    { "id": "fatigue-warning", "when": "fatigue >= 70", "message": "单位进入高疲劳状态", "level": "warning" },
    { "id": "unit-dead", "when": "unit-a.hp <= 0", "message": "{entity.name} 被消灭", "level": "critical" }
  ],
  "output": {
    "summary": ["fatigue"],
    "charts": [ { "x": "time", "y": "fatigue" } ]
  },
  "random": { "seed": 12345 }
}
```

---

## 4. 顶层结构与必填性

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `schema` | ✅ | 恒为 `"xylab-experiment@0.1"` |
| `experiment` | ✅ | 实验身份：`id` + `name` 必填，其余可选 |
| `timeline` | ✅ | 时间线：`mode`/`tick`/`duration` 全必填 |
| `variables` | ⭕ | 参数对象，键为变量名（可空） |
| `entities` | ⭕ | 实体数组（0～少量） |
| `formulas` | ⭕ | 公式数组，**执行顺序 = 数组顺序** |
| `watch` | ⭕ | 监控目标数组 |
| `events` | ⭕ | 事件数组 |
| `output` | ⭕ | 结果输出（summary + charts） |
| `random` | ⭕ | `{ "seed": 数字 }`，同 seed 结果可复现 |

### 命名规则与保留字

- 变量名：`^[a-z][a-z0-9_]*$`（snake_case，小写开头）
- 实体 id：`^[a-z0-9][a-z0-9_-]*$`（**禁点号**，保证 `实体路径 = entityId.stateKey` 无歧义）
- 实验 id：`^[a-z0-9][a-z0-9._-]*$`
- **保留字 `time`、`dt` 不可用作变量名**（报 `RESERVED_NAME`）

---

## 5. 分字段规则速查

### variables（变量）

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `type` | ✅ | `number` / `integer` / `boolean` / `enum` / `string` |
| `value` | ✅ | 初值，类型必须匹配（不匹配报 `VARIABLE_TYPE_INVALID`） |
| `label` / `unit` | ⭕ | 面板显示名 / 单位 |
| `min`/`max`/`step` | ⭕ | **仅 number/integer**；只是 UI 控件提示，**不是运行时钳制**——要限制取值请在公式里用 `clamp()` |
| `options` | enum 必填 | 非空数组，`value` 必须在其中 |

UI 自动映射：number → 滑杆/数值框，integer → 数值框，boolean → 开关，enum → 下拉，string → 文本框。

### entities（实体）

`id` 必填且唯一（重复报 `DUPLICATE_ENTITY_ID`）；`state` 为对象，v0.1 值为 number。公式与监控可用实体路径 `unit-a.hp` 作为 target。

### formulas（公式）

```json
{ "id": "任意标识", "target": "变量名或 unit-a.hp", "expression": "受限表达式" }
```

- 同一 tick 内按数组顺序依次结算；公式读到的是**本 tick 快照**（先算的不影响后算读取，写回统一提交）。
- target 不存在报 `FORMULA_TARGET_NOT_FOUND`。

**表达式语言**：

- 运算符：`+ - * / % ( ) < > <= >= == != && ||`
- 函数：`min() max() clamp() abs() floor() ceil() round() sqrt() pow()`
- 标识符：变量名、实体路径、`dt`（本 tick 时长）、`time`（当前模拟时间）、数值/布尔字面量
- 禁止：`eval`、`Function()`、任何 JS 全局对象——公式永远不能变成任意代码
- 语义：`==` 是严格相等（无隐式转换）；`&&`/`||` 短路；除零/模零/`sqrt(负数)` 等直接硬失败（运行进入 failed 并保留 lastError）
- 幂运算没有 `^`，用 `pow(x, 2)`；不支持 `1e3`、`.5`、`0xFF` 这类写法

### timeline（时间线）

| 字段 | 规则 |
| --- | --- |
| `mode` | v0.1 仅 `"fixed_tick"` |
| `tick` | 每 tick 推进的模拟秒数，>0（如 0.1 / 1 / 10） |
| `duration` | 模拟总时长，>0 |

**`duration / tick` 必须是 ≥1 的整数**，否则报 `INVALID_TIMELINE_RANGE`（例：duration 100 + tick 0.3 ✗）。模拟时间与真实时间分离，播放速度由运行区 x1/x10/x100/MAX 控制，与 `tick` 无关。

### watch（监控）

| mode | 语义 | 附加字段 |
| --- | --- | --- |
| `value` | 每 tick 记录当前值（画曲线的来源） | — |
| `change` | 仅值变化时记录 | — |
| `threshold` | **跨过**阈值时触发一次（上升/下降沿，回落后重新武装） | `threshold` 必填；`operator` 可选：`>=` `>` `<=` `<` `==` `!=`，缺省 `>=` |

target 不存在报 `WATCH_TARGET_NOT_FOUND`。R2 可视化规则：**图表曲线优先取 `output.charts` 声明的目标**，没声明时自动回退前几个数值型 watch；threshold watch 会在图上画结构化阈值虚线。

### events（事件）

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `id` | ✅ | 事件标识 |
| `when` | ✅ | 布尔表达式（同一套受限表达式语言） |
| `message` | ⭕ | 缺省用 `id`；支持模板 `{变量名}`、`{entityId.stateKey}`、`{entity.name}` |
| `level` | ⭕ | `trace`/`info`/`notice`/`warning`/`critical`，缺省 `info` |
| `repeat` | ⭕ | 缺省 `false` = **上升沿只触发一次**；`true` = 条件为真期间每 tick 触发 |

### output（输出）

- `summary`：目标名数组 → 结果自动统计 Initial / Final / Min / Max / Average / Delta
- `charts`：折线图数组，**`x` 固定 `"time"`**（写别的报 `UNKNOWN_VARIABLE_REFERENCE`），`y` 为变量名或实体路径，可多条

### random（随机）

`{ "seed": 数字 }` 可选。同 JSON + 同 seed + 同版本 ⇒ 结果一致。公式内可用 `random()` 取 [0,1) 随机数；Reset 后随机序列从 seed 重新开始。

---

## 6. 加载器自动补的默认值（Normalize）

加载器**只补充协议明文规定的默认值**，绝不猜测语义：

| 项 | 默认 |
| --- | --- |
| `timeline.totalTicks` | 自动计算 = duration / tick |
| threshold watch 的 `operator` | `>=` |
| event 的 `message` / `level` / `repeat` | 事件 `id` / `info` / `false` |
| `output` / `random` | 不写就没有，不发明默认值 |

---

## 7. 错误码速查（加载失败时对照）

| 错误码 | 典型原因 |
| --- | --- |
| `INVALID_JSON` | 不是合法 JSON（注意：不允许注释、尾逗号） |
| `SCHEMA_VALIDATION_FAILED` | 结构非法/未知字段（**严格模式：拼错的字段名直接报错**，报错带 path 明细） |
| `FORMULA_TARGET_NOT_FOUND` | 公式 target 不是已知变量/实体路径 |
| `WATCH_TARGET_NOT_FOUND` | watch.target 不存在 |
| `DUPLICATE_ENTITY_ID` | 实体 id 重复 |
| `UNKNOWN_VARIABLE_REFERENCE` | summary/charts 引用不存在；chart 的 x ≠ "time" |
| `INVALID_TIMELINE_RANGE` | duration/tick 不是 ≥1 的整数 tick 数 |
| `VARIABLE_TYPE_INVALID` | value 与 type 不匹配；enum value 不在 options；min/max/step 用在非数值类型 |
| `RESERVED_NAME` | 变量名占用了 `time` / `dt` |
| 表达式类错误 | `UNKNOWN_IDENTIFIER`（公式里写了不存在的变量）、`EXPRESSION_PARSE_ERROR`（语法错）、`UNKNOWN_EVENT_TARGET` 等，加载期即拦截 |

原则：**非法实验明确 FAIL，绝不静默纠错。**

---

## 8. 常见错误清单（按踩坑频率）

1. **写了协议没有的字段** → 严格模式直接拒。字段名照抄本指南第 3 节模板。
2. **把 min/max 当运行时限制** → 它只是 UI 提示；要钳制写 `clamp(x, 0, 100)`。
3. **duration/tick 除不尽** → 保证 tick 数是整数（600/1 ✓，100/0.3 ✗）。
4. **变量起名 `time` 或 `dt`** → 保留字，改名。
5. **charts 的 x 写了变量名** → x 只能是 `"time"`。
6. **JSON 里加注释或尾逗号** → 标准 JSON 不允许，`INVALID_JSON`。
7. **enum 忘写 options / value 不在 options** → `VARIABLE_TYPE_INVALID`。
8. **公式里用 `^` 表示幂** → 用 `pow()`。
9. **以为事件会一直刷** → 默认上升沿只触发一次，需要持续报用 `repeat: true`。
10. **integer 变量公式算出小数** → 写回被拒（运行 failed）；integer target 的结果必须是整数。

---

## 9. 在 XYLab 里使用的完整流程

1. 启动：仓库目录执行 `npm run dev`（Windows 建议 `npx vite --host 127.0.0.1` 显式绑定），打开浏览器访问终端给出的地址（默认 http://127.0.0.1:5173/ ）。
2. 「实验」页签：粘贴 JSON，或点 Open JSON 选文件，或点「内置示例」加载 fatigue-basic。校验失败会显示具体错误码与路径，不会破坏已加载实验。
3. 参数自动生成 → 改参数 → 「应用并重新初始化」（草稿边界：不点应用不影响运行中的实验）。
4. 运行区：Run / Pause / Resume / Step / Stop / Reset + x1/x10/x100/MAX。
5. 监控页签：Metric 卡 + 实时曲线；**点按曲线可锁定时间点**，Metric/检查器联动读该时刻数据；「跟随实时」解锁。
6. 一等操作：
   - **[复制 JSON]** = 当前生效定义（含已应用的参数值）——**调好参数后复制出来就是一个新模板**，可直接存档或下次粘贴复用。
   - **[保存结果]** → 写备注 → 保存进浏览器本地历史；「历史」页签随时回看、复制该 Run 的 JSON。

---

## 10. 模板变体建议

- **纯观察型**（只看曲线）：保留 variables + formulas + timeline + watch(value) + output.charts，删掉 events。
- **阈值告警型**：给目标加一条 `{ "mode": "threshold", "threshold": 数值 }` 的 watch，并配一条同条件的 event（level: warning）。
- **实体战斗型**：entities + 实体路径公式（`unit-a.hp`），watch 用 change 模式观察跳变。
- **复现实验**：加 `"random": { "seed": 固定值 }`，两次运行逐 tick 一致。

---

*本指南为总结性文档，字段规则若有疑义以 `docs/experiment-protocol-0.1.md`（R1 冻结契约）为准。*
