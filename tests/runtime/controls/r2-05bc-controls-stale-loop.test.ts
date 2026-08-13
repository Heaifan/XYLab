// R2-05BC Controls 测试（stale-loop 三危险场景）：S01~S04。
import { describe, expect, it } from 'vitest';
import { drain, manualScheduler, makeControls } from './helpers';

function manualBasic() {
  return makeControls(
    { variables: { a: { type: 'number', value: 0 } }, formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }], tick: 1, duration: 100 },
    manualScheduler().scheduler,
  );
}

describe('R2-05BC Controls · stale-loop 防护', () => {
  it('B06 重复 Run → INVALID_RUNTIME_TRANSITION（单 active loop）', () => {
    const { ctrl } = manualBasic();
    expect(ctrl.run('x1').ok).toBe(true);
    const out = ctrl.run();
    expect(out.ok).toBe(false);
    if (out.ok) throw new Error('expected failure');
    expect(out.code).toBe('INVALID_RUNTIME_TRANSITION');
    expect(ctrl.status).toBe('running'); // 原循环仍是唯一权威
  });

  it('S01 Pause 后旧循环不得产生尾随 Tick', () => {
    const { ctrl } = manualBasic();
    ctrl.run('x10'); // 首批 10 tick 同步执行后挂起
    expect(ctrl.state.tickIndex).toBe(10);
    ctrl.pause();
    expect(ctrl.state.tickIndex).toBe(10); // Pause 本身零 Tick
  });

  it('S02 Reset 后旧循环苏醒不得修改新 Runtime', () => {
    const m = manualScheduler();
    const { ctrl } = makeControls(
      { variables: { a: { type: 'number', value: 0 } }, formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }], tick: 1, duration: 100 },
      m.scheduler,
    );
    ctrl.run('x10');
    expect(ctrl.state.tickIndex).toBe(10);
    ctrl.reset();
    expect(ctrl.state.tickIndex).toBe(0); // 新 Runtime
    const newState = ctrl.state;
    m.release(); // 旧循环苏醒
    expect(ctrl.state).toBe(newState); // 新 Runtime 未被替换
    expect(ctrl.state.tickIndex).toBe(0); // 未被旧循环写脏
    expect(ctrl.state.time).toBe(0);
  });

  it('S03 Pause→Resume 无双循环（旧循环零贡献，新循环为唯一权威）', async () => {
    const m = manualScheduler();
    const { ctrl } = makeControls(
      {
        variables: { a: { type: 'number', value: 0 } },
        formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
        tick: 1,
        duration: 100,
      },
      m.scheduler,
    );
    ctrl.run('x10'); // batch1：tickIndex 10，挂起 waits[0]
    ctrl.pause();
    ctrl.resume(); // 新循环 batch2 同步：tickIndex 20，挂起 waits[1]
    expect(ctrl.state.tickIndex).toBe(20);
    m.release(); // 唤醒 waits[0] = 旧循环 → 代际不匹配，零 Tick
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(ctrl.state.tickIndex).toBe(20); // 旧循环贡献 0
    await drain(ctrl, m); // 新循环继续至 completed
    expect(ctrl.status).toBe('completed');
    expect(ctrl.state.tickIndex).toBe(100); // 恰好 100，无双循环重复
    expect(ctrl.state.variables.a).toBe(100);
  });

  it('S04 Stop 取消循环：苏醒后不写任何 Tick', () => {
    const m = manualScheduler();
    const { ctrl } = makeControls(
      {
        variables: { a: { type: 'number', value: 0 } },
        formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
        tick: 1,
        duration: 100,
      },
      m.scheduler,
    );
    ctrl.run('x10');
    ctrl.stop();
    expect(ctrl.status).toBe('stopped');
    m.release(); // 旧循环苏醒
    expect(ctrl.state.tickIndex).toBe(10); // 无尾随 Tick
    expect(ctrl.status).toBe('stopped');
  });
});
