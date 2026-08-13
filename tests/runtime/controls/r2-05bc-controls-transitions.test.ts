// R2-05BC Controls 测试（状态转换与守卫）：B01~B05、B07~B11。
import { describe, expect, it } from 'vitest';
import { drain, instantScheduler, manualScheduler, makeControls } from './helpers';

function basic() {
  return makeControls(
    { variables: { a: { type: 'number', value: 0 } }, formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }], tick: 1, duration: 10 },
    instantScheduler(),
  );
}

describe('R2-05BC Controls · 状态转换', () => {
  it('B01 ready → Run → running', () => {
    const { ctrl } = basic();
    const out = ctrl.run();
    expect(out.ok).toBe(true);
    expect(ctrl.status).toBe('running');
  });

  it('B02 running → Pause → paused', () => {
    const { ctrl } = basic();
    ctrl.run();
    const out = ctrl.pause();
    expect(out.ok).toBe(true);
    expect(ctrl.status).toBe('paused');
  });

  it('B03 paused → Resume → running', () => {
    const { ctrl } = basic();
    ctrl.run();
    ctrl.pause();
    const out = ctrl.resume();
    expect(out.ok).toBe(true);
    expect(ctrl.status).toBe('running');
  });

  it('B04 running → Stop → stopped', () => {
    const { ctrl } = basic();
    ctrl.run();
    const out = ctrl.stop();
    expect(out.ok).toBe(true);
    expect(ctrl.status).toBe('stopped');
  });

  it('B05 paused → Stop → stopped', () => {
    const { ctrl } = basic();
    ctrl.run();
    ctrl.pause();
    const out = ctrl.stop();
    expect(out.ok).toBe(true);
    expect(ctrl.status).toBe('stopped');
  });

  it('B07 ready 不允许 Pause/Resume/Stop', () => {
    const { ctrl } = basic();
    for (const out of [ctrl.pause(), ctrl.resume(), ctrl.stop()]) {
      expect(out.ok).toBe(false);
      if (out.ok) throw new Error('expected failure');
      expect(out.code).toBe('INVALID_RUNTIME_TRANSITION');
    }
    expect(ctrl.status).toBe('ready');
  });

  it('B10 stopped 后 Run/Resume/Step 全禁止，Reset → ready 后可再 Run', () => {
    const { ctrl } = basic();
    ctrl.run();
    ctrl.stop();
    expect(ctrl.run().ok).toBe(false);
    expect(ctrl.resume().ok).toBe(false);
    expect(ctrl.step().ok).toBe(false);
    ctrl.reset();
    expect(ctrl.status).toBe('ready');
    expect(ctrl.run().ok).toBe(true);
  });

  it('B11 Resume 继续当前 state/time/tickIndex，绝不 Reset', async () => {
    const m = manualScheduler();
    const { ctrl } = makeControls(
      { variables: { a: { type: 'number', value: 0 } }, formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }], tick: 1, duration: 100 },
      m.scheduler,
    );
    ctrl.run('x1'); // 1 tick 后挂起
    expect(ctrl.state.tickIndex).toBe(1);
    ctrl.pause();
    ctrl.resume(); // 继续而非重启
    await drain(ctrl, m);
    expect(ctrl.status).toBe('completed');
    expect(ctrl.state.tickIndex).toBe(100); // 连续 100 tick（若重启只会到 99）
    expect(ctrl.state.variables.a).toBe(100);
    expect(ctrl.state.time).toBe(100);
  });
});
