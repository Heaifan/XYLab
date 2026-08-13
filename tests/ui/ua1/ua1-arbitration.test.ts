// UA1 focused test：量纲仲裁（T15/T16）——异量纲加入且处于绝对值 → 自动切相对变化 + 一次轻提示；同单位不触发。
import { describe, expect, it } from 'vitest';
import { VIEW_INIT, selectToggle, type ViewState } from '../../../src/ui/viewState';
import { makeTickDef } from '../../runtime/fixtures';

function unitDef() {
  const def = makeTickDef({
    variables: { troop_a: { type: 'number', value: 100 }, troop_b: { type: 'number', value: 100 }, fatigue: { type: 'number', value: 0 }, speed: { type: 'number', value: 1 } },
    watch: [{ target: 'troop_a', mode: 'value' }, { target: 'troop_b', mode: 'value' }, { target: 'fatigue', mode: 'value' }, { target: 'speed', mode: 'value' }],
    tick: 1, duration: 4,
  });
  def.variables.troop_a.unit = '人';
  def.variables.troop_b.unit = '人';
  def.variables.fatigue.unit = '%';
  def.variables.speed.unit = 'm/s';
  return def;
}

describe('UA1 · 绝对值/相对变化仲裁', () => {
  it('同单位加入不切换模式、无提示（场景 A：双部队兵力）', () => {
    const def = unitDef();
    const r = selectToggle(selectToggle(VIEW_INIT, def, 'troop_a').view, def, 'troop_b');
    expect(r.view.selected).toEqual(['troop_a', 'troop_b']);
    expect(r.view.mode).toBe('absolute');
    expect(r.toast).toBeNull();
  });
  it('异量纲加入且绝对值 → 自动切相对变化 + 一次轻提示（场景 C）', () => {
    const def = unitDef();
    const r = selectToggle(selectToggle(VIEW_INIT, def, 'troop_a').view, def, 'fatigue');
    expect(r.view.mode).toBe('relative');
    expect(r.toast).toBe('不同量纲，已切换到相对变化');
  });
  it('已处相对模式不重复提示；移出不自动切回（模式只由用户显式回切）', () => {
    const def = unitDef();
    const mixed = selectToggle(selectToggle(VIEW_INIT, def, 'troop_a').view, def, 'fatigue').view;
    const again = selectToggle(mixed, def, 'speed'); // 相对模式加入第三项
    expect(again.view.mode).toBe('relative');
    expect(again.toast).toBeNull();
    const back = selectToggle(again.view, def, 'speed'); // 移出
    expect(back.view.mode).toBe('relative');
    expect(back.toast).toBeNull();
  });
  it('用户显式回切绝对值后，再加异量纲会再次触发切换与提示', () => {
    const def = unitDef();
    const base: ViewState = { ...VIEW_INIT, selected: ['troop_a'], mode: 'absolute' };
    const r = selectToggle(base, def, 'fatigue');
    expect(r.view.mode).toBe('relative');
    expect(r.toast).not.toBeNull();
  });
  it('无单位定义（def 缺失/未声明 unit）按同组处理，不误切换', () => {
    const r = selectToggle(selectToggle(VIEW_INIT, null, 'a').view, null, 'b');
    expect(r.view.mode).toBe('absolute');
    expect(r.toast).toBeNull();
  });
});
