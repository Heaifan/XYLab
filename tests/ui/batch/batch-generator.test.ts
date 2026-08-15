import { describe, expect, it } from 'vitest';
import type { ExperimentDefinition } from '../../../src/protocol/types';
import { buildSweepGroups } from '../../../src/ui/batch/compare/model';
import { expandBatchScenarios } from '../../../src/ui/batch/generator/expand';
const def=(batch:ExperimentDefinition['batch']):ExperimentDefinition=>({
  schemaVersion:'xylab-experiment@0.1',experiment:{id:'x',name:'x'},
  variables:{
    distance_m:{name:'distance_m',type:'number',value:100,label:'距离',unit:'m'},
    dispersion_mrad:{name:'dispersion_mrad',type:'number',value:1,label:'散布',unit:'mrad'},
    rpm:{name:'rpm',type:'number',value:30,label:'射速',unit:'rpm'},
  },entities:[],formulas:[],timeline:{mode:'fixed_tick',tick:1,duration:1,totalTicks:1},watch:[],events:[],batch,
});
describe('BATCH-3/MSV-1 generator',()=>{
  it('expands matrix dimensions × seeds in stable order',()=>{
    const rows=expandBatchScenarios(def({dimensions:[{variable:'distance_m',values:[100,200]}],seeds:{start:7,end:8,step:1}}));
    expect(rows.map(r=>[r.overrides.distance_m,r.seed])).toEqual([[100,7],[100,8],[200,7],[200,8]]);
    expect(rows.map(r=>r.id)).toEqual(['json-1','json-2','json-3','json-4']);
  });
  it('keeps matrix as the backward-compatible default',()=>{
    const rows=expandBatchScenarios(def({dimensions:[
      {variable:'distance_m',values:[100,200,300,400,500]},
      {variable:'dispersion_mrad',values:[0.5,1,2]},
      {variable:'rpm',values:[10,30,600]},
    ]}));
    expect(rows).toHaveLength(45);
  });
  it('sweep changes one dimension at a time and de-duplicates the shared baseline',()=>{
    const rows=expandBatchScenarios(def({mode:'sweep',dimensions:[
      {variable:'distance_m',values:[100,200,300,400,500]},
      {variable:'dispersion_mrad',values:[0.5,1,2]},
      {variable:'rpm',values:[10,30,600]},
    ]}));
    expect(rows).toHaveLength(9);
    expect(rows.filter(r=>r.name==='基准方案')).toHaveLength(1);
    expect(rows.every(r=>Object.keys(r.overrides).length===1)).toBe(true);
    const groups=buildSweepGroups(def({mode:'sweep',dimensions:[
      {variable:'distance_m',values:[100,200,300,400,500]},
      {variable:'dispersion_mrad',values:[0.5,1,2]},
      {variable:'rpm',values:[10,30,600]},
    ]}),rows,[]);
    expect(groups.map(g=>g.rows.length)).toEqual([5,3,3]);
    expect(groups.map(g=>g.rows.filter(row=>row.scenarios.some(s=>s.name==='基准方案')).length)).toEqual([1,1,1]);
  });
});
