# XYLab 实验协议 0.1（Experiment Protocol 0.1）

- **状态**：R1 冻结（2026-08-13）
- **协议标识**：`xylab-experiment@0.1`
- **定位**：XYLab 是玄域引擎机制公式的通用 Web 实验台。本协议定义「一份 JSON 如何完整描述一次实验」。

```
JSON → 实验 UI → 模拟 → 监控 → 结果
```

---

## 0. 协议原则

1. **定义与状态分离**：JSON 只描述「实验定义」；运行时的值属于 Runtime State（R2-02），Reset 时从定义重新初始化。
2. **一份 JSON = 一次实验**：身份、变量、实体、公式、时间线、监控、事件、输出全在一份文件里。
3. **严格校验**：加载器对未知字段报错（`additionalProperties: false`），尽早暴露拼写错误。
4. **可复现**：同 JSON + 同 seed + 同 Runtime 版本 ⇒ 结果一致（R6-04）。

## 顶层结构

```json
{
  "schema": "xylab-experiment@0.1",
  "experiment": { "id": "...", "name": "..." },
  "variables": { "...": { "type": "number", "value": 5 } },
  "entities": [ { "id": "unit-a", "state": { "hp": 100 } } ],
  "formulas": [ { "id": "...", "target": "...", "expression": "..." } ],
  "timeline": { "mode": "fixed_tick", "tick": 1, "duration": 600 },
  "watch": [ { "target": "fatigue", "mode": "value" } ],
  "events": [ { "id": "...", "when": "...", "level": "warning" } ],
  "output": { "summary": ["fatigue"], "charts": [{ "x": "time", "y": "fatigue" }] },
  "random": { "seed": 12345 }
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `schema` | ✅ | 恒为 `xylab-experiment@0.1` |
| `experiment` | ✅ | 实验身份（R1-01） |
| `timeline` | ✅ | 实验时间（R1-05） |
| `variables` | ⭕ | 实验参数（R1-02），可空（供「新建实验」） |
| `entities` | ⭕ | 实验实体（R1-03），0～少量 |
| `formulas` | ⭕ | 公式（R1-04），按数组顺序执行 |
| `watch` | ⭕ | 监控（R1-06） |
| `events` | ⭕ | 事件（R1-07） |
| `output` | ⭕ | 结果输出（R1-08） |
| `random` | ⭕ | 随机种子（R2-06 预留） |

---

## 1. R1-01 实验身份（Experiment Identity）

```json
{
  "experiment": {
    "id": "fatigue-basic-001",
    "name": "步兵基础疲劳测试",
    "description": "测试持续行军时疲劳累积",
    "category": "movement",
    "version": "0.1.0",
    "tags": ["fatigue", "movement"],
    "author": "Heaifan"
  }
}
```

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `id` | ✅ | `^[a-z0-9][a-z0-9._-]*$`（小写字母或数字开头） |
| `name` | ✅ | 非空字符串 |
| `description` | ⭕ | 字符串 |
| `category` | ⭕ | 字符串 |
| `version` | ⭕ | 字符串 |
| `tags` | ⭕ | 字符串数组 |
| `author` | ⭕ | 字符串 |
| `created_at` | ⭕ | ISO 8601 时间字符串 |

**验收（R1-01）**：加载器能回答三个问题——① 这是不是有效实验；② 实验叫什么；③ 使用哪个协议版本。

---

## 2. R1-02 变量（Variables）

`variables` 是顶层对象，**键为变量名**，值为变量定义。

```json
{
  "variables": {
    "move_speed": { "type": "number", "value": 5, "min": 0, "max": 20, "step": 0.1, "unit": "m/s", "label": "移动速度" },
    "fatigue":    { "type": "number", "value": 0, "min": 0, "max": 100, "unit": "%", "label": "疲劳度" },
    "enabled":    { "type": "boolean", "value": true, "label": "是否启用" },
    "stance":     { "type": "enum", "value": "hold", "options": ["hold", "advance", "retreat"], "label": "姿态" },
    "note":       { "type": "string", "value": "hello" }
  }
}
```

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `type` | ✅ | `number` / `integer` / `boolean` / `enum` / `string`（v0.1 五类） |
| `value` | ✅ | 初值；类型必须与 `type` 匹配（VARIABLE_TYPE_INVALID） |
| `label` | ⭕ | 面板显示名 |
| `unit` | ⭕ | 单位（如 m/s、%） |
| `min` / `max` / `step` | ⭕ | **仅 number/integer**；是 UI 提示（生成参数控件），**不是运行时钳制**，运行时限制请用 `clamp()` |
| `options` | ✅(enum) | enum 专属，非空数组 |

**变量命名**：`^[a-z][a-z0-9_]*$`（snake_case，小写开头）。**保留字 `time`、`dt` 不可用作变量名**（RESERVED_NAME）。

**UI 自动映射**：

| type | 控件 |
| --- | --- |
| number | Number Field / Slider |
| integer | Number Field |
| boolean | Toggle |
| enum | Select |
| string | Text Field |

---

## 3. R1-03 实体（Entities）

v0.1 允许 **0 / 1 / 少量实体**，不追求大规模。

```json
{
  "entities": [
    { "id": "unit-a", "name": "步兵 A", "type": "infantry", "state": { "hp": 100, "fatigue": 0, "morale": 80 } }
  ]
}
```

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `id` | ✅ | 唯一；`^[a-z0-9][a-z0-9_-]*$`（**禁点号**，保证实体路径无歧义） |
| `name` | ⭕ | 显示名 |
| `type` | ⭕ | 类型标签 |
| `state` | ⭕ | 对象，值为 number |

**实体路径**：`entityId.stateKey`（点号连接），如 `unit-a.hp`。state key 采用变量命名规则。重复 id 报 `DUPLICATE_ENTITY_ID`。

---

## 4. R1-04 公式与表达式语言（Formula）

```json
{
  "formulas": [
    { "id": "fatigue-growth", "target": "fatigue", "expression": "fatigue + move_speed * fatigue_rate * dt" }
  ]
}
```

- **执行顺序 = 数组顺序**（冻结）。以后「先结算伤害还是先结算士气」直接影响结果。
- `target`：变量名或实体路径（`unit-a.hp`）。
- `expression`：受限制表达式，**实现为 tokenizer → parser → AST → validate → evaluate（R2-03），绝不调用 `eval()`**。

**允许的运算符**：`+  -  *  /  %  ( )  <  >  <=  >=  ==  !=  &&  ||`

**允许的函数**：`min()  max()  clamp()  abs()  floor()  ceil()  round()  sqrt()  pow()`

**允许的标识符**：变量名、实体路径、`dt`（本 tick 时长）、`time`（当前模拟时间）、数值字面量。

**未来扩展（v0.1 不实现）**：`lerp`、`random`、`curve`、`distance`。

**禁止**：`window`、`document`、`fetch`、`localStorage`、`Function()`、`eval()` 及一切 JS 全局/代码执行——公式 JSON 永远不能变成任意代码。

**语义错误**：`FORMULA_TARGET_NOT_FOUND`、`EXPRESSION_PARSE_ERROR`、`UNKNOWN_IDENTIFIER`。

---

## 5. R1-05 时间线（Timeline）

```json
{ "timeline": { "mode": "fixed_tick", "tick": 1, "duration": 600 } }
```

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `mode` | ✅ | v0.1 仅 `fixed_tick` |
| `tick` | ✅ | 每 tick 推进的模拟秒数（>0），支持 0.1 / 1 / 10 |
| `duration` | ✅ | 模拟总时长（>0） |

- tick 数 = `duration / tick`；运行器内部 `simulation_time += tick`。
- **模拟时间与墙钟分离**：600 秒模拟可 0.5 秒跑完；显示速度由运行器速度档（x1/x10/x100/MAX，R4-04）控制。
- 错误：`INVALID_DURATION`、`INVALID_TICK`。

---

## 6. R1-06 监控（Watch）

```json
{
  "watch": [
    { "target": "fatigue", "mode": "value" },
    { "target": "unit-a.morale", "mode": "change" },
    { "target": "fatigue", "mode": "threshold", "threshold": 70, "operator": ">=" }
  ]
}
```

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `target` | ✅ | 变量名或实体路径 |
| `mode` | ✅ | `value` / `change` / `threshold` |
| `threshold` | ✅(threshold) | 阈值（数值） |
| `operator` | ⭕ | `>=` `>` `<=` `<` `==` `!=`，默认 `>=` |

**模式语义**：

- `value`：每 tick 记录当前值（`fatigue 0 → 0.8 → 1.6 → 2.4`）
- `change`：仅值变化时记录（`fatigue +0.8`）
- `threshold`：**跨过**阈值时记录（上升/下降沿各触发一次，不与 repeat 相同）

错误：`UNKNOWN_WATCH_TARGET`。

---

## 7. R1-07 事件（Events）—— 将来即「战场弹幕系统」

```json
{
  "events": [
    { "id": "fatigue-warning", "when": "fatigue >= 70", "message": "单位进入高疲劳状态", "level": "warning" },
    { "id": "unit-dead", "when": "unit-a.hp <= 0", "message": "{entity.name} 被消灭", "level": "critical" }
  ]
}
```

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `id` | ✅ | 事件标识 |
| `when` | ✅ | 布尔表达式（受限制表达式语言） |
| `message` | ⭕ | 模板文本，缺省用 `id` |
| `level` | ⭕ | `trace` / `info` / `notice` / `warning` / `critical`，默认 `info` |
| `repeat` | ⭕ | 默认 `false` |

**触发语义**：默认**上升沿触发一次**（条件由假变真时触发一次，避免日志刷屏）；`repeat: true` 时条件为真期间每 tick 触发。

**message 模板**：`{变量名}` → 变量当前值；`{entityId.stateKey}` → 实体状态值；`{entity.name}` → 实体显示名。

**输出示例**：

```
[03:42] ⚠ 步兵 A 疲劳达到 70.4
[06:17] 💥 步兵 A 被消灭
```

---

## 8. R1-08 输出（Output）

```json
{
  "output": {
    "summary": ["fatigue", "distance", "average_speed"],
    "charts": [ { "x": "time", "y": "fatigue" } ]
  }
}
```

- `summary`：目标名数组 → 结果页自动统计 **Initial / Final / Min / Max / Average / Delta**（R3-05 实现）。
- `charts`：v0.1 仅支持折线图，`x` 固定 `time`，`y` 为单目标（变量名或实体路径），可多条（R3-04 实现）。

**结果页示例**：

```
实验结束 | 模拟时间 600s
Fatigue:  Initial 0  Final 87  Max 91  Average 44  Delta +87
```

---

## 9. 预留：随机种子（R2-06）

```json
{ "random": { "seed": 12345 } }
```

可选。同一 seed ⇒ 输入一致 ⇒ 结果一致（方便复现实验）。v0.1 已在协议层预留，运行时实现属于 R2-06。

---

## 10. 语义校验错误码（R2-01 Loader 实现目录）

加载器必须报**明确错误码**，禁止「运行失败」这类模糊错误：

| 错误码 | 场景 |
| --- | --- |
| `FORMULA_TARGET_NOT_FOUND` | 公式 target 不是已知变量/实体路径 |
| `VARIABLE_TYPE_INVALID` | value 与 type 不匹配；enum value 不在 options 内 |
| `UNKNOWN_WATCH_TARGET` | watch.target 不存在 |
| `UNKNOWN_EVENT_TARGET` | event.when 引用了未知标识符 |
| `INVALID_DURATION` / `INVALID_TICK` | 时间线参数非法 |
| `DUPLICATE_ENTITY_ID` | 实体 id 重复 |
| `UNKNOWN_IDENTIFIER` | 表达式引用未知标识符 |
| `RESERVED_NAME` | 变量名占用保留字 `time` / `dt` |
| `EXPRESSION_PARSE_ERROR` | 表达式语法错误 |

---

## 11. 协议演进规则

- 本协议由**轮次评审冻结**：R1 冻结即契约。
- 任何字段增删必须走后续轮次评审，并**同步更新 schema / 示例 / 本文档**。
- 加载器维持严格模式（未知字段报错），保证「协议与实现永远一致」。

---

## 12. 文件

| 文件 | 作用 |
| --- | --- |
| `schema/experiment.schema.json` | 机器校验（JSON Schema draft-07） |
| `examples/fatigue-basic.json` | XYLab Hello World（R1-09） |
| `docs/experiment-protocol-0.1.md` | 本文档（人类可读契约） |
