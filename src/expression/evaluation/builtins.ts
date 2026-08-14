// R2-03D · 内置数学函数实现。
// 数值结果一律 finite 检查；非法定义域明确失败，绝不静默修正。

import type { SourceSpan } from '../syntax/ast';
import type { EvalValue } from './types';
import { ExpressionEvaluationError } from './errors';

function asNumbers(args: EvalValue[], span: SourceSpan): number[] {
  return args.map((a) => {
    if (typeof a !== 'number') {
      throw new ExpressionEvaluationError('RUNTIME_TYPE_MISMATCH', `内置函数参数期望 number，得到 ${typeof a}`, span);
    }
    return a;
  });
}

export function finite(v: number, span: SourceSpan): number {
  if (!Number.isFinite(v)) {
    throw new ExpressionEvaluationError('NON_FINITE_RESULT', `计算结果必须是有限数值，得到 ${v}`, span);
  }
  return v;
}

export function applyBuiltin(name: string, args: EvalValue[], span: SourceSpan): EvalValue {
  const n = asNumbers(args, span);
  switch (name) {
    case 'min':
      return finite(Math.min(...n), span);
    case 'max':
      return finite(Math.max(...n), span);
    case 'clamp': {
      const v = n[0];
      const lo = n[1];
      const hi = n[2];
      if (lo > hi) {
        throw new ExpressionEvaluationError('INVALID_CLAMP_RANGE', `clamp 下限 ${lo} 大于上限 ${hi}（不自动交换，避免掩盖实验定义错误）`, span);
      }
      return finite(Math.min(Math.max(v, lo), hi), span);
    }
    case 'abs':
      return finite(Math.abs(n[0]), span);
    case 'floor':
      return finite(Math.floor(n[0]), span);
    case 'ceil':
      return finite(Math.ceil(n[0]), span);
    case 'round':
      return finite(Math.round(n[0]), span);
    case 'sqrt': {
      const x = n[0];
      if (x < 0) {
        throw new ExpressionEvaluationError('DOMAIN_ERROR', `sqrt 定义域要求 ≥ 0，得到 ${x}`, span);
      }
      return finite(Math.sqrt(x), span);
    }
    case 'pow':
      return finite(Math.pow(n[0], n[1]), span);
    case 'sin':
      return finite(Math.sin(n[0]), span);
    case 'cos':
      return finite(Math.cos(n[0]), span);
    default:
      throw new ExpressionEvaluationError('INTERNAL_EVALUATION_ERROR', `内置函数 '${name}' 无实现（语义白名单应已拦截）`, span);
  }
}
