// FE-A-R1 · 投影测试：MonitorSnapshot 是 UI 唯一数据契约（T03/T05/T06/T07/T08）。
import { describe, expect, it } from 'vitest';
import { createMonitoredRuntime } from '../../src/monitor/session';
import { readBridge } from '../../src/ui/monitor/useMonitor';
import { makeTickDef } from '../runtime/fixtures';

// 混合形态定义：number/boolean/string 三类 watch + protocol event（边缘触发）
function mixedRuntime() {
  const def = makeTickDef({
    variables: { b: { type: 'number', value: 0 }, a: { type: 'boolean', value: false }, note: { type: 'string', value: 'x' } },
    formulas: [
      { id: 'f-b', target: 'b', expression: 'b + 2' },
      { id: 'f-a', target: 'a', expression: 'b >= 3' },
    ],
    watch: [
      { target: 'b', mode: 'value' },
      { target: 'a', mode: 'value' },
      { target: 'note', mode: 'change' },
    ],
    events: [{ id: 'hot', when: 'b >= 4', message: '过热', level: 'warning' }],
    tick: 1,
    duration: 10,
  });
  return createMonitoredRuntime(def);
}

describe('FE-A-R1 · MonitorSnapshot 投影', () => {
  it('T03：watches 按协议声明顺序进入快照（UI 直接按序渲染）', () => {
    const rt = mixedRuntime();
    rt.controller.step();
    const snap = rt.session.snapshot();
    expect(snap.watches.map((w) => w.target)).toEqual(['b', 'a', 'note']);
    expect(Object.keys(snap.series)).toEqual(['b', 'a', 'note']);
  });

  it('T05：Numeric Statistics 正确投影（initial/current/min/max/average/delta/sampleCount）', () => {
    const rt = mixedRuntime();
    rt.controller.step(); rt.controller.step(); rt.controller.step(); // b: 0→2→4→6
    const snap = rt.session.snapshot();
    expect(snap.statistics.b).toEqual({ kind: 'numeric', initial: 0, current: 6, min: 0, max: 6, average: 3, delta: 6, sampleCount: 4 });
  });

  it('T06：Boolean Statistics 正确投影（initial/current/changeCount）', () => {
    const rt = mixedRuntime();
    rt.controller.step(); rt.controller.step(); rt.controller.step();
    const snap = rt.session.snapshot();
    const st = snap.statistics.a;
    expect(st.kind).toBe('boolean');
    expect(st).toEqual({ kind: 'boolean', initial: false, current: true, changeCount: 1 });
  });

  it('T07/T08：日志域收敛——kind/source 仅来自核心，change 带结构化前后值，UI diff 日志不复存在', () => {
    const rt = mixedRuntime();
    rt.controller.step(); rt.controller.step(); rt.controller.step();
    const snap = rt.session.snapshot();
    expect(snap.logs.length).toBeGreaterThan(0);
    for (const l of snap.logs) {
      expect(['change', 'event', 'runtime']).toContain(l.kind);
      expect(['tick', 'session', 'runtime', 'hot', `watch:${l.target ?? ''}`]).toContain(l.source);
      if (l.kind === 'change') {
        expect(l.previousValue).toBeDefined();
        expect(l.currentValue).toBeDefined();
      }
    }
    // 边缘触发：b>=4 在 tick2 变真后持续为真，'hot' 只落账一次
    expect(snap.logs.filter((l) => l.source === 'hot')).toHaveLength(1);
    // Second Truth 已废除：不存在任何 UI 自造来源的日志
    expect(snap.logs.some((l) => l.source === 'ui' || l.source === 'diff')).toBe(false);
  });

  it('非数值 watch 仅 series 无统计；string 最新值可投影', () => {
    const rt = mixedRuntime();
    rt.controller.step();
    const snap = rt.session.snapshot();
    expect('note' in snap.statistics).toBe(false);
    const noteSeries = snap.series.note;
    expect(noteSeries[noteSeries.length - 1].value).toBe('x');
  });

  it('readBridge：null → EMPTY；有效句柄 → 镜像 Controller 状态', () => {
    expect(readBridge(null)).toEqual({ snap: null, time: 0, tickIndex: 0, status: '—', lastError: null });
    const rt = mixedRuntime();
    rt.controller.step();
    const b = readBridge(rt);
    expect(b.time).toBe(1);
    expect(b.tickIndex).toBe(1);
    expect(b.status).toBe('paused');
    expect(b.lastError).toBeNull();
    expect(b.snap).not.toBeNull();
  });
});
