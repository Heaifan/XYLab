import { describe, expect, it } from 'vitest';
import type { ExperimentDefinition } from '../../../src/protocol/types';
import { runBatch, runBatchScenario } from '../../../src/ui/batch/runner';
import { batchResultExport, scenarioResultExport } from '../../../src/ui/batch/types';
const def: ExperimentDefinition = {
  schemaVersion:'xylab-experiment@0.1',experiment:{id:'batch-test',name:'Batch Test'},
  variables:{rate:{name:'rate',type:'number',value:1,label:'速率',unit:'m/s'},value:{name:'value',type:'number',value:0,label:'结果',unit:'m'}},
  entities:[],formulas:[{id:'grow',target:'value',expression:'value + rate * dt'}],
  timeline:{mode:'fixed_tick',tick:1,duration:10,totalTicks:10},watch:[{target:'value',mode:'value'}],events:[],
  output:{summary:['value'],charts:[{x:'time',y:'value'}]},random:{seed:7},
};
const a={id:'a',name:'A',overrides:{rate:1}}, b={id:'b',name:'B',overrides:{rate:3}};
describe('BATCH-2 regression under MSV-1',()=>{
  it('applies overrides without mutating base definition',async()=>{
    const r=await runBatchScenario(def,b,10);
    expect(r.status).toBe('completed'); expect(r.values.value).toBe(30); expect(def.variables.rate.value).toBe(1);
  });
  it('keeps Tick-only monitor statistics',async()=>{
    const r=await runBatchScenario(def,a,5), st=r.snapshot.statistics.value;
    expect(r.snapshot.series.value).toHaveLength(6); expect(r.snapshot.session.tickCount).toBe(5);
    if(st.kind!=='numeric') throw new Error('expected numeric');
    expect(st.sampleCount).toBe(5); expect(st.average).toBe(3); expect(st.sampleStdDev).toBeCloseTo(Math.sqrt(2.5));
  });
  it('runs scenarios in order',async()=>{
    const rs=await runBatch(def,[a,b],5);
    expect(rs.map(r=>r.scenarioId)).toEqual(['a','b']); expect(rs.map(r=>r.values.value)).toEqual([5,15]);
  });
  it('batch export omits series but keeps statistics',async()=>{
    const rs=await runBatch(def,[a,b],5), out=batchResultExport(def,[a,b],rs,'a',5,'value');
    expect(out.scenarios[1].inputs.rate).toBe(3); expect(out.scenarios[1].summary.value).toBe(15);
    expect('series' in out.scenarios[1]).toBe(false);
    const st=out.scenarios[0].statistics.value; if(st.kind!=='numeric') throw new Error('expected numeric');
    expect(st.sampleCount).toBe(5);
  });
  it('scenario export keeps full series and effective random',async()=>{
    const r=await runBatchScenario(def,b,5), out=scenarioResultExport(def,b,r,5);
    expect(out.series.value).toHaveLength(6); expect(out.inputs.rate).toBe(3); expect(out.random).toEqual({seed:7});
  });
});
