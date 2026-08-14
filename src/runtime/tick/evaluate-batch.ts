// R2-04 · T2/T3：Tick 快照 + 公式批量求值。
// 冻结语义：同一 Tick 内所有公式读取同一个 Tick-start Snapshot，互不可见写入；
// 全部求值成功后由 commit 统一提交（Snapshot Read → Evaluate All → Batch Commit）。

import { tokenizeExpression } from '../../expression/tokenizer';
import { parseExpression } from '../../expression/syntax/parser';
import { ExpressionParseError } from '../../expression/syntax/parse-error';
import { validateFormula } from '../../expression/semantic/validator';
import { ExpressionSemanticError } from '../../expression/semantic/errors';
import { evaluate } from '../../expression/evaluation/evaluator';
import { ExpressionEvaluationError } from '../../expression/evaluation/errors';
import { ExpressionTokenizeError } from '../../expression/errors';
import type { EvaluationContext, EvalValue } from '../../expression/evaluation/types';
import type { ExperimentDefinition } from '../../protocol/types';
import { nextRandom } from '../random/prng';
import type { RuntimeState, RuntimeValue } from '../types';
import type { TickError } from './types';

export interface PendingWrite {
  formulaId: string;
  target: string;
  value: EvalValue;
}

export interface BatchResult {
  writes: PendingWrite[];
  rngState?: number;
  error?: TickError;
}

function wrapError(formulaId: string, target: string, e: unknown): TickError {
  const any = e as { code?: string; span?: { start: number; end: number }; message?: string };
  const semantic =
    e instanceof ExpressionSemanticError || e instanceof ExpressionParseError || e instanceof ExpressionTokenizeError;
  return {
    code: semantic ? 'FORMULA_SEMANTIC_ERROR' : 'FORMULA_EVALUATION_ERROR',
    message: any.message ?? String(e),
    formulaId,
    target,
    causeCode: any.code,
    span: any.span,
  };
}

export function evaluateFormulaBatch(definition: ExperimentDefinition, state: RuntimeState): BatchResult {
  const snapshotVars: Record<string, RuntimeValue> = { ...state.variables };
  const ctxVars: Record<string, EvalValue> = {};
  for (const [k, v] of Object.entries(snapshotVars)) {
    if (typeof v === 'number' || typeof v === 'boolean') ctxVars[k] = v;
  }

  let rngState = state.rng.state;
  const random = (): number => {
    const draw = nextRandom(rngState);
    rngState = draw.nextState;
    return draw.value;
  };

  const ctx: EvaluationContext = {
    variables: ctxVars,
    builtins: { dt: definition.timeline.tick, PI: Math.PI },
    random,
  };

  const writes: PendingWrite[] = [];
  for (const f of definition.formulas) {
    if (!definition.variables[f.target]) {
      return {
        writes,
        error: {
          code: 'UNSUPPORTED_TARGET_KIND',
          message: `公式 target '${f.target}' 不是变量（v0.1 Tick 不支持实体路径写回）`,
          formulaId: f.id,
          target: f.target,
        },
      };
    }
    try {
      const validated = validateFormula(f, definition);
      const value = evaluate(validated.ast, ctx);
      writes.push({ formulaId: f.id, target: f.target, value });
    } catch (e) {
      return { writes, error: wrapError(f.id, f.target, e) };
    }
  }
  return { writes, rngState };
}
