import { describe, expect, it } from 'vitest';
import type { ExperimentDefinition } from '../../../src/protocol/types';
import { runBatchScenario } from '../../../src/ui/batch/runner';
import { batchResultExport } from '../../../src/ui/batch/types';
const def:ExperimentDefinition={
  schemaVersion:'xylab-experiment@0.1',experiment:{id:'seed-test',name:'Seed Test'},
  variables:{x:{name:'x',type:'number',value:0}},entities:[],formulas:[{id:'r',target:'x',expression:'random()'}],
  timeline:{mode:'fixed_tick',tick:1,duration:10,totalTicks:10},watch:[{target:'x',mode:'value'}],events:[],
  output:{summary:['x'],charts:[{x:'time',y:'x'}]},random:{seed:1},
};
describe('MSV-1 Batch seed override',()=>{
  it('same seed is deterministic, different seed changes sequence',async()=>{
    const a={id:'a',name:'A',overrides:{},seed:1943},b={id:'b',name:'B',overrides:{},seed:1943},c={id:'c',name:'C',overrides:{},seed:1944};
    const [ra,rb,rc]=await Promise.all([runBatchScenario(def,a,10),runBatchScenario(def,b,10),runBatchScenario(def,c,10)]);
    expect(ra.snapshot.series.x).toEqual(rb.snapshot.series.x);
    expect(ra.snapshot.series.x).not.toEqual(rc.snapshot.series.x);
  });
  it('exports effective scenario seed',async()=>{
    const s={id:'s',name:'S',overrides:{},seed:1944},r=await runBatchScenario(def,s,5);
    const out=batchResultExport(def,[s],[r],'s',5,'x');
    expect(out.scenarios[0].seed).toBe(1944);
  });
});
