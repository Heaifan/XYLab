// UA1 · XYUI-8 Visualization Catalog 注册（XYLab 只做 Consumer/Adapter：语义 REF vendor/xyui XYUI-8 canonical）。
// 全量 21 类入口全部注册；是否可点由 Compatibility Engine（compat.ts）裁决——数据不足的登记 Disabled+Reason，不删入口不伪造数据。
export type VizCat = 'trend' | 'compare' | 'relation' | 'state' | 'composition' | 'distribution' | 'process' | 'advanced';

export interface VizDef {
  id: string;
  cat: VizCat;
  label: string;
  spec: string; // XYUI-8 组件编号（可追溯性）
  min: number; // 选择数量下限
  max: number; // 选择数量上限
  abs: boolean; // 支持绝对值
  rel: boolean; // 支持相对变化
  sameUnitAbs: boolean; // 绝对值模式要求同单位
  thresholdOnly: boolean; // 仅对 threshold Watch 有效
  data: 'series' | 'sample' | 'grid' | 'dep' | 'p2w'; // 需求数据形态（series = 当前单 Run 时间序列）
  reason: string; // data ≠ series 时的 Disabled 理由
}

export const CATS: { id: VizCat; label: string }[] = [
  { id: 'trend', label: '趋势' }, { id: 'compare', label: '比较' }, { id: 'relation', label: '关系' }, { id: 'state', label: '状态' },
  { id: 'composition', label: '组成' }, { id: 'distribution', label: '分布' }, { id: 'process', label: '过程' }, { id: 'advanced', label: '高级' },
];

export const CATALOG: VizDef[] = [
  { id: 'line', cat: 'trend', label: '折线图', spec: '8-06', min: 1, max: 12, abs: true, rel: true, sameUnitAbs: true, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'area', cat: 'trend', label: '面积图', spec: '8-07', min: 1, max: 4, abs: true, rel: true, sameUnitAbs: true, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'step', cat: 'trend', label: '阶梯图', spec: '8-06', min: 1, max: 12, abs: true, rel: true, sameUnitAbs: true, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'bar', cat: 'compare', label: '柱状图', spec: '8-08', min: 1, max: 8, abs: true, rel: true, sameUnitAbs: true, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'hbar', cat: 'compare', label: '横向条形图', spec: '8-08', min: 1, max: 8, abs: true, rel: true, sameUnitAbs: true, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'delta', cat: 'compare', label: 'Delta 偏差', spec: '8-08', min: 1, max: 8, abs: true, rel: true, sameUnitAbs: false, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'scatter', cat: 'relation', label: '散点图', spec: '8-10', min: 2, max: 2, abs: true, rel: false, sameUnitAbs: false, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'gauge', cat: 'state', label: 'Gauge 阈值仪表', spec: '8-13', min: 1, max: 4, abs: true, rel: false, sameUnitAbs: false, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'range', cat: 'state', label: 'Range 区间', spec: '8-04', min: 1, max: 4, abs: true, rel: false, sameUnitAbs: false, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'tband', cat: 'state', label: 'Threshold Band', spec: '8-04', min: 1, max: 8, abs: true, rel: false, sameUnitAbs: false, thresholdOnly: true, data: 'series', reason: '' },
  { id: 'stackbar', cat: 'composition', label: '堆叠柱/面积', spec: '8-07/8-08', min: 2, max: 4, abs: true, rel: false, sameUnitAbs: true, thresholdOnly: false, data: 'p2w', reason: '需 part-to-whole 组成语义（当前 watch 未定义组成关系）' },
  { id: 'pctstack', cat: 'composition', label: '百分比堆叠', spec: '8-07', min: 2, max: 4, abs: true, rel: false, sameUnitAbs: true, thresholdOnly: false, data: 'p2w', reason: '需 part-to-whole 组成语义（当前 watch 未定义组成关系）' },
  { id: 'pie', cat: 'composition', label: '饼图', spec: '—', min: 2, max: 6, abs: true, rel: false, sameUnitAbs: true, thresholdOnly: false, data: 'p2w', reason: '当前数据不存在组成关系（XYUI-8 未收录 Pie）' },
  { id: 'donut', cat: 'composition', label: '环形图', spec: '—', min: 2, max: 6, abs: true, rel: false, sameUnitAbs: true, thresholdOnly: false, data: 'p2w', reason: '当前数据不存在组成关系（XYUI-8 未收录 Donut）' },
  { id: 'hist', cat: 'distribution', label: '直方图', spec: '8-09', min: 1, max: 4, abs: true, rel: false, sameUnitAbs: true, thresholdOnly: false, data: 'sample', reason: '需要多 Run 样本集合（当前为单 Run 时间序列）' },
  { id: 'box', cat: 'distribution', label: 'Box Plot', spec: '8-09', min: 1, max: 8, abs: true, rel: false, sameUnitAbs: true, thresholdOnly: false, data: 'sample', reason: '需要多 Run 样本集合（当前为单 Run 时间序列）' },
  { id: 'heatmap', cat: 'distribution', label: '热力图', spec: '8-11', min: 2, max: 12, abs: true, rel: false, sameUnitAbs: true, thresholdOnly: false, data: 'grid', reason: '需要二维矩阵数据（对象×时间 / 参数网格）' },
  { id: 'timeline', cat: 'process', label: 'Timeline', spec: '8-12', min: 0, max: 12, abs: true, rel: false, sameUnitAbs: false, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'etrack', cat: 'process', label: 'Event Track', spec: '8-12', min: 0, max: 12, abs: true, rel: false, sameUnitAbs: false, thresholdOnly: false, data: 'grid', reason: '需要事件泳道分组数据（当前可用 Timeline compact）' },
  { id: 'table', cat: 'advanced', label: 'Advanced Table', spec: '8-01', min: 1, max: 12, abs: true, rel: false, sameUnitAbs: false, thresholdOnly: false, data: 'series', reason: '' },
  { id: 'depgraph', cat: 'advanced', label: 'Dependency Graph', spec: '—', min: 1, max: 12, abs: true, rel: false, sameUnitAbs: false, thresholdOnly: false, data: 'dep', reason: '依赖图数据源未定义（协议未暴露公式依赖）' },
];

export function byId(id: string): VizDef | undefined {
  return CATALOG.find((d) => d.id === id);
}
