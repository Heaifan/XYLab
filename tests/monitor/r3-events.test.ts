// R3 Monitoring 测试（Protocol Event 边缘触发）：E1~E5。
import { describe, expect, it } from 'vitest';
import { createMonitoredRuntime } from '../../src/monitor/session';
import { makeTickDef } from '../runtime/fixtures';

describe('R3 Monitoring · Protocol Event 边缘触发', () => {
  it('E1 false→true 触发一次；持续 true 不重复；level/message 正确', () => {
    const { controller, session } = createMonitoredRuntime(
      makeTickDef({
        variables: { a: { type: 'number', value: 0 } },
        formulas: [{ id: 'f', target: 'a', expression: 'a + 45' }],
        tick: 1,
        duration: 10,
        events: [{ id: 'high', when: 'a >= 70', message: '进入高疲劳', level: 'warning' }],
      }),
    );
    controller.step(); // 45
    controller.step(); // 90 → fire
    controller.step(); // 135 → 不重复
    controller.step(); // 180 → 不重复
    const fired = session.snapshot().logs.filter((l) => l.kind === 'event');
    expect(fired).toHaveLength(1);
    expect(fired[0].tickIndex).toBe(2);
    expect(fired[0].level).toBe('warning');
    expect(fired[0].message).toBe('进入高疲劳');
    expect(fired[0].source).toBe('high');
  });

  it('E2 true→false 重武装，再次 false→true 可再次触发', () => {
    const { controller, session } = createMonitoredRuntime(
      makeTickDef({
        variables: { a: { type: 'number', value: 0 } },
        formulas: [{ id: 'f', target: 'a', expression: '(a + 20) % 50' }],
        tick: 1,
        duration: 10,
        events: [{ id: 'mid', when: 'a >= 30', message: '过中', level: 'notice' }],
      }),
    );
    for (let i = 0; i < 5; i++) controller.step(); // 20,40,10,30,0
    const fired = session.snapshot().logs.filter((l) => l.kind === 'event');
    expect(fired.map((l) => l.tickIndex)).toEqual([2, 4]);
  });

  it('E3 未知标识符条件：构建期警告 + 事件禁用（不静默）', () => {
    const { session } = createMonitoredRuntime(
      makeTickDef({
        variables: { a: { type: 'number', value: 0 } },
        formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
        events: [{ id: 'bad', when: 'ghost >= 1' }],
      }),
    );
    const snap = session.snapshot();
    const warns = snap.logs.filter((l) => l.kind === 'runtime' && l.level === 'warning');
    expect(warns).toHaveLength(1);
    expect(warns[0].message).toContain('bad');
  });

  it('E4 非布尔条件：构建期警告 + 事件禁用', () => {
    const { session } = createMonitoredRuntime(
      makeTickDef({
        variables: { a: { type: 'number', value: 0 } },
        formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
        events: [{ id: 'nb', when: 'a + 1' }],
      }),
    );
    const warns = session.snapshot().logs.filter((l) => l.kind === 'runtime');
    expect(warns).toHaveLength(1);
    expect(warns[0].message).toContain('boolean');
  });

  it('E5 Runtime Failure 进入统一日志（保留失败前数据）', () => {
    const { controller, session } = createMonitoredRuntime(
      makeTickDef({
        variables: { a: { type: 'number', value: 0 }, b: { type: 'number', value: 0 } },
        formulas: [
          { id: 'f1', target: 'a', expression: 'a + 1' },
          { id: 'f2', target: 'b', expression: '1 / b' },
        ],
        watch: [{ target: 'a', mode: 'value' }],
      }),
    );
    controller.step(); // 原子失败
    const snap = session.snapshot();
    const crit = snap.logs.filter((l) => l.kind === 'runtime' && l.level === 'critical');
    expect(crit).toHaveLength(1);
    expect(crit[0].message).toContain('Tick 失败');
    expect(snap.session.failure).not.toBeNull();
    expect(snap.session.failure!.code).toBe('FORMULA_EVALUATION_ERROR');
    expect(snap.session.tickCount).toBe(0);
    expect(snap.series.a).toHaveLength(1); // 仅初始点，失败 Tick 不追加
    expect(snap.series.a[0].value).toBe(0);
  });
});
