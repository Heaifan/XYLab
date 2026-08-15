import { describe, expect, it } from 'vitest';
import type { ExperimentDefinition } from '../../../src/protocol/types';
import { expandBatchScenarios } from '../../../src/ui/batch/generator/expand';
const def=(batch:ExperimentDefinition['batch']):ExperimentDefinition=>({
  schemaVersion:'xylab-experiment@0.1',experiment:{id:'x',name:'x'},
  variables:{distance_m:{name:'distance_m',type:'number',value:100,label:'距离',unit:'m'}},entities:[],formulas:[],
  timeline:{mode:'fixed_tick',tick:1,duration:1,totalTicks:1},watch:[],events:[],batch,
});
describe('BATCH-2/MSV-1 generator',()=>{
  it('expands dimensions × seeds in stable order',()=>{
    const rows=expandBatchScenarios(def({dimensions:[{variable:'distance_m',values:[100,200]}],seeds:{start:7,end:8,step:1}}));
    expect(rows.map(r=>[r.overrides.distance_m,r.seed])).toEqual([[100,7],[100,8],[200,7],[200,8]]);
    expect(rows.map(r=>r.id)).toEqual(['json-1','json-2','json-3','json-4']);
  });
  it('keeps old no-seed expansion',()=>{
    const rows=expandBatchScenarios(def({dimensions:[{variable:'distance_m',values:[100,200]}]}));
    expect(rows.map(r=>r.seed)).toEqual([undefined,undefined]);
  });
});
