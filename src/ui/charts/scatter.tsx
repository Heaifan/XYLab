// Scatter：二维弹着 + 径向 σ 统计；X/Y 是坐标，不是两条系列。
import { useState } from 'react';
import type { SeriesPoint } from '../../monitor/types';
import type { ExperimentDefinition } from '../../protocol/types';
import { formatNumber } from '../format';
import { valueAtTime } from '../monitor/metricModel';
import { H, PAD, labelOf, useWidth } from '../viz/shared';
import { unitOf } from '../viewState';

type Pt = { x: number; y: number }; export type ScatterRangeMode = 'reference' | 'all';
interface Props { series: Record<string, SeriesPoint[]>; def: ExperimentDefinition | null; targets: string[]; xT: string; yT: string;
  onAssign: (field: 'x' | 'y', t: string) => void; onSwap: () => void; }
export function scatterPairs(series: Record<string, SeriesPoint[]>, xT: string, yT: string): Pt[] {
  const out: Pt[] = [], ys = series[yT] ?? [];
  for (const p of series[xT] ?? []) { const q = valueAtTime(ys, p.time);
    if (p.tickIndex !== 0 && q?.tickIndex !== 0 && typeof p.value === 'number' && q?.time === p.time && typeof q.value === 'number') out.push({ x: p.value, y: q.value }); }
  return out;
}
export function scatterExtent(pts: Pt[], sigma: number | null, mode: ScatterRangeMode): number {
  let extent = sigma ? sigma * 3 : 0;
  if (mode === 'all' || !sigma) for (const p of pts) extent = Math.max(extent, Math.abs(p.x), Math.abs(p.y));
  return extent > 0 ? extent * 1.08 : 1;
}
export function scatterOutsideReference(pts: Pt[], sigma: number | null): number {
  return sigma ? pts.filter(p => Math.hypot(p.x, p.y) > sigma * 3).length : 0;
}
export function scatterDotVisual(count: number) {
  if (count >= 1000) return { r: 1.7, opacity: 0.62 }; if (count >= 500) return { r: 2, opacity: 0.72 };
  if (count >= 200) return { r: 2.2, opacity: 0.8 }; return { r: 2.5, opacity: 0.9 };
}
const avg = (a: number[]) => a.length ? a.reduce((s,v)=>s+v,0)/a.length : 0;
const sd = (a: number[], m: number) => a.length < 2 ? 0 : Math.sqrt(a.reduce((s,v)=>s+(v-m)*(v-m),0)/(a.length-1));
export function scatterDistributionStats(pts: Pt[], sigma: number) {
  const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y), n=pts.length, meanX=avg(xs), meanY=avg(ys), sigmaX=sd(xs,meanX), sigmaY=sd(ys,meanY);
  const bands=[1,2,3].map(k=>{ const count=pts.filter(p=>Math.hypot(p.x,p.y)<=k*sigma).length, ratio=n?count/n:0, theory=1-Math.exp(-(k*k)/2);
    const tol=Math.max(0.005,3*Math.sqrt(theory*(1-theory)/Math.max(1,n))); return {k,count,ratio,theory,pass:Math.abs(ratio-theory)<=tol}; });
  const ready=n>=100, mt=n?3*sigma/Math.sqrt(n):0, st=n>1?3*sigma/Math.sqrt(2*(n-1)):0;
  const moments=Math.abs(meanX)<=mt&&Math.abs(meanY)<=mt&&Math.abs(sigmaX-sigma)<=st&&Math.abs(sigmaY-sigma)<=st;
  return { n, meanX, meanY, sigmaX, sigmaY, bands, ready, pass: ready&&moments&&bands.every(b=>b.pass) };
}
function referenceSigma(def: ExperimentDefinition | null, series: Record<string, SeriesPoint[]>): number | null {
  for (const key of ['dispersion_sigma_m','sigma_m','dispersion_radius_m']) { const live=series[key]?.at(-1)?.value, fixed=def?.variables[key]?.value;
    if (typeof live==='number'&&live>0) return live; if (typeof fixed==='number'&&fixed>0) return fixed; }
  const d=def?.variables.distance_m?.value,m=def?.variables.dispersion_mrad?.value; return typeof d==='number'&&typeof m==='number'&&d>0&&m>0?d*m/1000:null;
}
const pct=(v:number)=>`${(v*100).toFixed(1)}%`;
export function ScatterChart({ series, def, targets, xT, yT, onAssign, onSwap }: Props) {
  const [ref,w]=useWidth(), pts=scatterPairs(series,xT,yT), [range,setRange]=useState<ScatterRangeMode>('reference'), [showSigma,setShowSigma]=useState(true);
  const sigma=unitOf(def,xT)===unitOf(def,yT)?referenceSigma(def,series):null, active:ScatterRangeMode=sigma?range:'all';
  const limit=sigma?sigma*3:Infinity, visible=active==='reference'?pts.filter(p=>Math.hypot(p.x,p.y)<=limit):pts, out=scatterOutsideReference(pts,sigma);
  const stats=sigma?scatterDistributionStats(pts,sigma):null, dot=scatterDotVisual(pts.length), half=scatterExtent(pts,sigma,active);
  const plotW=Math.max(1,w-PAD.l-PAD.r), plotH=H-PAD.t-PAD.b, side=Math.min(plotW,plotH), cx=PAD.l+plotW/2, cy=PAD.t+plotH/2, scale=side/(2*half);
  const left=cx-side/2,right=cx+side/2,top=cy-side/2,bottom=cy+side/2,X=(v:number)=>cx+v*scale,Y=(v:number)=>cy-v*scale;
  const axis=(t:string)=>`${labelOf(def,t)}${unitOf(def,t)?` (${unitOf(def,t)})`:''}`;
  return <div ref={ref}>
    <div className="legend" aria-label="散点图图例"><span className="legend-item"><b>●</b>弹着点</span><span className="legend-item"><b>⊕</b>瞄准中心</span>{sigma&&<span className="legend-item"><b>○</b>1σ / 2σ / 3σ</span>}</div>
    <div className="scatter-ctl row"><label>X <select value={xT} onChange={e=>onAssign('x',e.target.value)}>{targets.map(t=><option key={t} value={t}>{labelOf(def,t)}</option>)}</select></label>
      <label>Y <select value={yT} onChange={e=>onAssign('y',e.target.value)}>{targets.map(t=><option key={t} value={t}>{labelOf(def,t)}</option>)}</select></label><button onClick={onSwap}>⇄ 交换</button>
      {sigma&&<><div className="seg"><button className={range==='reference'?'on':''} onClick={()=>setRange('reference')}>参考范围 ±3σ</button><button className={range==='all'?'on':''} onClick={()=>setRange('all')}>全部数据</button></div><button onClick={()=>setShowSigma(v=>!v)}>σ辅助圈 {showSigma?'开':'关'}</button></>}
      <span className="muted">{pts.length} 发{sigma?` · 3σ圆外 ${out} 发`:''}</span></div>
    {stats&&<div className="stats muted"><strong className={stats.pass?'feedback-ok':'level-warning'}>分布验证 {stats.ready?(stats.pass?'PASS':'CHECK'):'样本不足'}</strong><span>均值 X {formatNumber(stats.meanX)} · Y {formatNumber(stats.meanY)}</span><span>样本σ X {formatNumber(stats.sigmaX)} · Y {formatNumber(stats.sigmaY)}</span>{stats.bands.map(b=><span key={b.k}>{b.k}σ内 {pct(b.ratio)} · 理论 {pct(b.theory)} {b.pass?'✓':'!'}</span>)}</div>}
    {pts.length===0?<p className="muted">无配对数据。</p>:<svg width="100%" height={H} role="img" aria-label="二维弹着散点图">
      <line x1={left} x2={right} y1={cy} y2={cy} className="chart-grid"/><line x1={cx} x2={cx} y1={top} y2={bottom} className="chart-grid"/>
      {showSigma&&sigma&&[1,2,3].map(n=><circle key={n} cx={cx} cy={cy} r={n*sigma*scale} fill="none" className="chart-grid"/>)}
      <g><circle cx={cx} cy={cy} r={4} className="chart-dot s-1"/><line x1={cx-6} x2={cx+6} y1={cy} y2={cy} className="chart-lock"/><line x1={cx} x2={cx} y1={cy-6} y2={cy+6} className="chart-lock"/></g>
      <text x={left} y={top+10} className="chart-axis">{formatNumber(half)}</text><text x={left} y={bottom} className="chart-axis">-{formatNumber(half)}</text><text x={left} y={H-6} className="chart-axis">-{formatNumber(half)}</text><text x={right} y={H-6} textAnchor="end" className="chart-axis">{formatNumber(half)}</text>
      {visible.map((p,i)=><circle key={i} cx={X(p.x)} cy={Y(p.y)} r={dot.r} opacity={dot.opacity} className="scatter-dot"/>)}
      {showSigma&&sigma&&[1,2,3].map(n=>{const r=n*sigma*scale;return <text key={n} x={cx+r*.7} y={cy-r*.7} className="chart-axis">{n}σ</text>;})}
    </svg>}
    <p className="muted chart-note">X = {axis(xT)} · Y = {axis(yT)} · X/Y 等比例 · ⊕ = 瞄准中心{sigma?` · 参考σ = ${formatNumber(sigma)} ${unitOf(def,xT)}`:''}</p>
  </div>;
}