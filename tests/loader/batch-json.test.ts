import { describe, expect, it } from 'vitest';
import { loadExperiment } from '../../src/protocol/loader';
const base = (batch: unknown) => JSON.stringify({
  schema:'xylab-experiment@0.1', experiment:{id:'batch-test',name:'Batch'},
  variables:{distance_m:{type:'number',value:100}}, timeline:{mode:'fixed_tick',tick:1,duration:10}, batch,
});
describe('BATCH-2/MSV-1 Loader', () => {
  it('accepts deterministic seed sweep', () => {
    const r=loadExperiment(base({tick_limit:1000,seeds:{start:1943,end:1952,step:1},dimensions:[{variable:'distance_m',values:[100]}]}));
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(r.definition.batch?.seeds).toEqual({start:1943,end:1952,step:1});
  });
  it('rejects non-integer seed ranges', () => {
    const r=loadExperiment(base({seeds:{start:1.5,end:3.5,step:1},dimensions:[{variable:'distance_m',values:[100]}]}));
    expect(r.ok).toBe(false); if (r.ok) return;
    expect(r.errors.some(e=>e.code==='BATCH_RANGE_INVALID'&&e.path==='/batch/seeds')).toBe(true);
  });
  it('includes seed cardinality in 1000 scenario cap', () => {
    const r=loadExperiment(base({seeds:{start:1,end:101,step:1},dimensions:[{variable:'distance_m',range:{start:1,end:10,step:1}}]}));
    expect(r.ok).toBe(false); if (r.ok) return;
    expect(r.errors.some(e=>e.code==='BATCH_SCENARIO_LIMIT_EXCEEDED')).toBe(true);
  });
  it('old batch without seeds remains valid', () => {
    expect(loadExperiment(base({dimensions:[{variable:'distance_m',values:[100,200]}]})).ok).toBe(true);
  });
});
