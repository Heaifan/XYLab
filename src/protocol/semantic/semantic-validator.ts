// R2-01/BATCH-2 · 语义校验编排：聚合变量、引用与 Batch 规则，不 fail-fast。
import type { LoadError } from '../loader-types';
import type { RawExperiment } from '../raw-types';
import { checkBatch } from '../batch/semantic';
import { checkVariables } from './variable-rules';
import { checkReferences } from './reference-rules';
export function validateSemantics(raw: RawExperiment): LoadError[] {
  const errors: LoadError[] = [];
  checkVariables(raw, errors);
  checkReferences(raw, errors);
  checkBatch(raw, errors);
  return errors;
}
