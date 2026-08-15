# BATCH-2 + STAT-1 · User Acceptance Evidence · 2026-08-15

## 输入

同一实验定义：Kar98k 模型验证参数 `weapon_sigma_x_mrad=0.25`、`weapon_sigma_y_mrad=0.32`；Batch `distance_m=100..500 step 100`；`tick_limit=1000`；seed `1943`。

> 当前 0.25/0.32 mrad 仅为 XYLab 模型验证参数，不声明为 Kar98k 历史实枪定标数据。

## BATCH-2 真机结果

JSON 自动生成 5 个场景并全部完成：

| Scenario | distance | current σX | current σY | status |
| --- | ---: | ---: | ---: | --- |
| json-1 | 100m | 2.5cm | 3.2cm | completed |
| json-2 | 200m | 5.0cm | 6.4cm | completed |
| json-3 | 300m | 7.5cm | 9.6cm | completed |
| json-4 | 400m | 10.0cm | 12.8cm | completed |
| json-5 | 500m | 12.5cm | 16.0cm | completed |

距离→线性 σ 比例严格为 `1:2:3:4:5`。

## STAT-1 真机结果

所有场景 `sampleCount=1000`，确认 `time=0` 初始化点未再冒充第 1001 个模拟样本。

| distance | Mean X cm | Mean Y cm | sample σX cm | target σX | error | sample σY cm | target σY | error |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 0.020872 | -0.073158 | 2.438782 | 2.5 | -2.45% | 3.323673 | 3.2 | +3.86% |
| 200 | 0.041744 | -0.146317 | 4.877563 | 5.0 | -2.45% | 6.647346 | 6.4 | +3.86% |
| 300 | 0.062616 | -0.219475 | 7.316345 | 7.5 | -2.45% | 9.971020 | 9.6 | +3.86% |
| 400 | 0.083489 | -0.292633 | 9.755126 | 10.0 | -2.45% | 13.294693 | 12.8 | +3.86% |
| 500 | 0.104361 | -0.365792 | 12.193908 | 12.5 | -2.45% | 16.618366 | 16.0 | +3.86% |

100m 的 X/Y 样本 σ 均进入既定 ±8% 工程验收带，Mean 相对 σ 很小，中心无明显漂移。

## 统计解释边界

5 个距离共用 seed 1943，因此它们是**同一批标准化随机样本的五种尺度变换**，不能当作五次独立随机验证。它们足以验证：

1. Batch 自动场景生成与运行链；
2. 角度散布到线性散布的距离比例；
3. STAT-1 Tick-only N/Mean/sample σ 计算；
4. seed 1943 下 1000 样本符合当前模型目标。

不同 seed 的稳健性留给 `MSV-1 · Multi-Seed Statistical Validation`。

## 裁定

- BATCH-2：PASS / CLOSED
- STAT-1：PASS / CLOSED
- 角度制二维近似正态散布：基础统计验证 PASS；Multi-Seed 稳健性待 MSV-1
