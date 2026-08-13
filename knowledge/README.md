# XYLab Knowledge Base（经验位）

三位一体治理的「经验位」。Changelog 知道**做过什么**，Knowledge 知道**学到了什么**。

```text
knowledge/
├─ README.md     ← 本文件：体系规范
├─ decisions/    ← 架构与重要技术决策（为什么这样做）
├─ incidents/    ← 开发事故 / Bug / 根因（出了什么事，怎么查到的）
├─ patterns/     ← 已验证可复用模式（怎么做才对，可复制步骤）
└─ pitfalls/     ← 已知陷阱 / 禁止事项（别踩什么，禁止怎么实现）
```

## 入库门槛（六选一即可，否则只进 changelog）

1. 发生过真实事故
2. 找到隐藏根因
3. 做出重要架构决策
4. 形成可重复解决方法
5. 出现容易再次踩中的坑
6. 得出多个项目可以复用的经验

**Changelog = 全历史；Knowledge = 高价值经验。禁止政治作秀式建空壳条目。**

## 条目模板

```markdown
# <标题>

- 类别：decisions / incidents / patterns / pitfalls
- 入库条件：①~⑥（对应编号）
- 日期：YYYY-MM-DD

## 背景
## 现象（incidents/pitfalls 必填）
## 根因（incidents/pitfalls 必填）
## 决策 / 正确做法
## 禁止（pitfalls 必填：以后禁止怎样实现）
## 验证方式
```

## 目录出现规则

- 子目录（decisions/incidents/patterns/pitfalls）在第一条真实条目出现时才创建，不提前建空壳。
- 每轮结束必须做入库判断：`Knowledge: UPDATED` 或 `Knowledge: N/A`，写入轮次报告。
