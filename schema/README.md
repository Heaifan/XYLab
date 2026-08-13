# XYLab Experiment Schema

机器校验 Schema：`experiment.schema.json`（JSON Schema **draft-07**）。

- 对应协议：`xylab-experiment@0.1`
- 人类可读契约：[../docs/experiment-protocol-0.1.md](../docs/experiment-protocol-0.1.md)
- 完整示例：[../examples/fatigue-basic.json](../examples/fatigue-basic.json)

## 特性

- **严格模式**：所有对象 `additionalProperties: false` —— 未知字段一律报错，尽早暴露拼写错误。
- **命名约束**：变量名 `^[a-z][a-z0-9_]*$`；实验 id `^[a-z0-9][a-z0-9._-]*$`；实体 id `^[a-z0-9][a-z0-9_-]*$`（禁点号，保证实体路径无歧义）。
- **条件必填**：`enum` 变量必须带 `options`；`threshold` 模式的 watch 必须带 `threshold`。

## 校验方法

Python：

```bash
uv run --with jsonschema python -c "
import json, jsonschema
schema = json.load(open('schema/experiment.schema.json', encoding='utf-8'))
example = json.load(open('examples/fatigue-basic.json', encoding='utf-8'))
jsonschema.validate(example, schema)
print('PASS')
"
```

## 注意

- Schema 只做**结构校验**；语义校验（target 是否存在、表达式是否合法、value 与 type 是否匹配等）由 Runtime Loader（R2-01）负责，错误码见协议文档第 10 节。
- `value` 不限制具体类型（`{}`），避免 Schema 层与语义层双重规则漂移；类型匹配检查属 `VARIABLE_TYPE_INVALID`（R2）。
