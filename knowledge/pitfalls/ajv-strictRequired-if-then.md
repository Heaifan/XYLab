# ajv strictRequired 与 if/then 条件必填

- 类别：pitfalls
- 入库条件：① 真实事故 + ⑤ 容易再次踩中的坑
- 日期：2026-08-13

## 现象

R2-01 首次运行 `npm run verify`，vitest 全部失败，报错：

```
strict mode: required property "options" is not defined at
".../definitions/variable/allOf/0/then" (strictRequired)
```

Schema 本身是合法 draft-07（Python jsonschema 正例/负例全部通过），但 ajv 拒绝编译。

## 根因

ajv 严格模式的 `strictRequired` 规则：一个 schema 对象内的 `required` 关键字所引用的属性，必须在该对象的**同级** `properties` 中定义。我们用 if/then 表达条件必填（`enum` → `options`、`threshold` 模式 → `threshold`），required 出现在 `then` 分支，而属性定义在父级——ajv 认为「未定义」，直接拒绝编译。

这不是 Schema 错误，是 ajv 的过严 lint 规则。

## 正确做法

构造 Ajv 时只关这一条，其余严格检查全部保留：

```ts
const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
```

## 禁止

- ❌ 为了迁就 ajv 去修改已冻结的协议 Schema（R1 冻结即契约，一字节都不能动）。
- ❌ 整体 `strict: false` 放弃全部严格检查。
- ❌ 把条件必填从 if/then 改写成放宽必填（等于破坏协议约束）。

## 验证方式

保留条件必填的负例测试：`enum` 缺 `options`、`threshold` 模式缺 `threshold` 必须被拒绝（R2-01 T 系列 + schema 负例），确保关闭 strictRequired 后约束依然生效。
