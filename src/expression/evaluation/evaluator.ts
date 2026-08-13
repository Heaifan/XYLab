// R2-03D · 求值器：ValidatedExpression + EvaluationContext → EvalValue。
// 纯函数：绝不修改 context / RuntimeState / AST / ValidatedExpression。
// 目标写回（target = result）是 R2-04 Tick Engine 的权威职责，本层只产出结果。
// 冻结：除零/模零硬失败；一切数值结果必须 finite；== 为严格相等（=== 语义，无 JS coercion）；
// && / || 短路求值（保证 hp > 0 && 100 / hp > 2 在 hp=0 时不触发除零）。

import type { ExpressionNode, SourceSpan } from '../syntax/ast';
import type { EvalValue, EvaluationContext } from './types';
import { ExpressionEvaluationError } from './errors';
import { applyBuiltin, finite } from './builtins';

function num(v: EvalValue, span: SourceSpan): number {
  if (typeof v !== 'number') {
    throw new ExpressionEvaluationError('RUNTIME_TYPE_MISMATCH', `期望 number，得到 ${typeof v}`, span);
  }
  return v;
}

function bool(v: EvalValue, span: SourceSpan): boolean {
  if (typeof v !== 'boolean') {
    throw new ExpressionEvaluationError('RUNTIME_TYPE_MISMATCH', `期望 boolean，得到 ${typeof v}`, span);
  }
  return v;
}

export function evaluate(node: ExpressionNode, ctx: EvaluationContext): EvalValue {
  switch (node.type) {
    case 'NumberLiteral':
      return node.value;
    case 'BooleanLiteral':
      return node.value;
    case 'Identifier': {
      const v = ctx.variables[node.name];
      if (v !== undefined) return v;
      const b = ctx.builtins[node.name];
      if (b !== undefined) return b;
      throw new ExpressionEvaluationError('MISSING_RUNTIME_VALUE', `运行时缺少值 '${node.name}'`, node.span);
    }
    case 'UnaryExpression': {
      const o = evaluate(node.operand, ctx);
      if (node.operator === '!') return !bool(o, node.span);
      return -num(o, node.span);
    }
    case 'BinaryExpression': {
      const op = node.operator;
      if (op === '&&') {
        if (!bool(evaluate(node.left, ctx), node.left.span)) return false;
        return bool(evaluate(node.right, ctx), node.right.span);
      }
      if (op === '||') {
        if (bool(evaluate(node.left, ctx), node.left.span)) return true;
        return bool(evaluate(node.right, ctx), node.right.span);
      }
      const l = evaluate(node.left, ctx);
      const r = evaluate(node.right, ctx);
      switch (op) {
        case '+':
          return finite(num(l, node.span) + num(r, node.span), node.span);
        case '-':
          return finite(num(l, node.span) - num(r, node.span), node.span);
        case '*':
          return finite(num(l, node.span) * num(r, node.span), node.span);
        case '/': {
          const d = num(r, node.span);
          if (d === 0) throw new ExpressionEvaluationError('DIVISION_BY_ZERO', '除数为 0', node.span);
          return finite(num(l, node.span) / d, node.span);
        }
        case '%': {
          const d = num(r, node.span);
          if (d === 0) throw new ExpressionEvaluationError('MODULO_BY_ZERO', '模运算除数为 0', node.span);
          return finite(num(l, node.span) % d, node.span);
        }
        case '<':
          return num(l, node.span) < num(r, node.span);
        case '<=':
          return num(l, node.span) <= num(r, node.span);
        case '>':
          return num(l, node.span) > num(r, node.span);
        case '>=':
          return num(l, node.span) >= num(r, node.span);
        case '==':
          return l === r; // 严格相等（03C 已保证同类型）
        case '!=':
          return l !== r;
        default:
          throw new ExpressionEvaluationError('INTERNAL_EVALUATION_ERROR', `未知二元运算符 '${op}'`, node.span);
      }
    }
    case 'CallExpression': {
      const args = node.arguments.map((a) => evaluate(a, ctx));
      return applyBuiltin(node.callee, args, node.span);
    }
    default: {
      const n = node as unknown as { type: string; span: SourceSpan };
      throw new ExpressionEvaluationError('UNKNOWN_EVALUATOR_NODE', `未知 AST 节点 '${n.type}'`, n.span);
    }
  }
}
