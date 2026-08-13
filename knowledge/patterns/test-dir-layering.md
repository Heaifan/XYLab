# 测试目录触顶 5 规则时的子领域分层

- 类别：patterns
- 入库条件：④ 可重复解决方法 + ⑤ 容易再次踩中的坑
- 日期：2026-08-13

## 背景

R2-03B 新增 3 个 Parser 测试文件时，`tests/expression/` 将达 6 个文件，触顶底线位 5 规则（职责目录 ≤ 5 文件）。后续每轮都会向 tests/ 追加用例，此问题必然反复出现。

## 做法

按**子领域语义**分层，而非机械编号拆分：

```text
tests/expression/            ← 领域目录（触顶前）
  → tokenizer/               ← 词法子域（测试 + helpers.ts）
  → parser/                  ← 语法子域（测试 + helpers.ts）
```

- 共享夹具/工具随子领域走：`<子域>/helpers.ts`，且必须是非 `.test.ts` 文件——测试文件互相 import 会让 vitest 重复注册用例。
- 分层依据 = 领域语义（tokenizer vs parser），不是文件数量凑数。

## 禁止

- ❌ `parser-a.test.ts` / `parser-b.test.ts` 式机械编号拆分（100 红线同理）。
- ❌ 测试文件之间互相 import（重复执行 + 用例计数膨胀）。
- ❌ 为了留在 5 以内把不同领域塞进一个「杂项」目录。

## 验证方式

`npm run verify`：governance-guard 的 5 规则检查 + 全量测试不回退。
