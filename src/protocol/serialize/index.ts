// BATCH-2/MSV-1 · 内部可信 Definition → 可再次由 Loader 读取的外部实验 JSON。
import type { ExperimentDefinition } from '../types';
function externalInfo(definition: ExperimentDefinition): Record<string, unknown> {
  const { createdAt, ...rest } = definition.experiment;
  return createdAt ? { ...rest, created_at: createdAt } : rest;
}
function externalVariables(definition: ExperimentDefinition): Record<string, unknown> {
  return Object.fromEntries(Object.entries(definition.variables).map(([key, variable]) => {
    const { name: _name, ...rest } = variable; return [key, rest];
  }));
}
function externalBatch(definition: ExperimentDefinition): Record<string, unknown> | undefined {
  if (!definition.batch) return undefined;
  const out: Record<string, unknown> = { dimensions: definition.batch.dimensions.map((dimension) => ({
    variable: dimension.variable,
    ...(dimension.values ? { values: [...dimension.values] } : {}),
    ...(dimension.range ? { range: { ...dimension.range } } : {}),
  })) };
  if (definition.batch.tickLimit !== undefined) out.tick_limit = definition.batch.tickLimit;
  if (definition.batch.seeds) out.seeds = { ...definition.batch.seeds };
  return out;
}
export function experimentDocument(definition: ExperimentDefinition): Record<string, unknown> {
  const { totalTicks: _totalTicks, ...timeline } = definition.timeline;
  const out: Record<string, unknown> = {
    schema: definition.schemaVersion, experiment: externalInfo(definition), variables: externalVariables(definition),
    entities: definition.entities.map((entity) => ({ ...entity, state: { ...entity.state })), timeline,
    watch: definition.watch.map((watch) => ({ ...watch })), events: definition.events.map((event) => ({ ...event })),
  };
  if (definition.formulas.length) out.formulas = definition.formulas.map((formula) => ({ ...formula }));
  if (definition.output) out.output = { summary: [...definition.output.summary], charts: definition.output.charts.map((chart) => ({ ...chart })) };
  if (definition.random) out.random = { ...definition.random };
  const batch = externalBatch(definition); if (batch) out.batch = batch;
  return out;
}
