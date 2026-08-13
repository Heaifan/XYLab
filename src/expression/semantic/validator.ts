// R2-03C · 验证入口：AST → ValidatedExpression + Formula target 兼容性（C5）。
// 语义验证器只读 AST：不做 constant folding / 不重写 / 不计算（那是 R2-03D）。

import { tokenizeExpression } from '../tokenizer';
import { parseExpression } from '../syntax/parser';
import type { ExpressionNode } from '../syntax/ast';
import type { ExperimentDefinition, FormulaDefinition } from '../../protocol/types';
import type { ValidatedExpression } from './types';
import { buildSemanticContext } from './context';
import { inferType } from './infer';
import { ExpressionSemanticError } from './errors';

export function validateExpression(ast: ExpressionNode, definition: ExperimentDefinition): ValidatedExpression {
  const ctx = buildSemanticContext(definition);
  return { ast, resultType: inferType(ast, ctx) };
}

export function validateFormula(formula: FormulaDefinition, definition: ExperimentDefinition): ValidatedExpression {
  const ast = parseExpression(tokenizeExpression(formula.expression));
  const validated = validateExpression(ast, definition);
  checkTarget(formula, definition, validated);
  return validated;
}

function checkTarget(formula: FormulaDefinition, definition: ExperimentDefinition, validated: ValidatedExpression): void {
  const targetVar = definition.variables[formula.target];
  // 实体路径 target（entityId.stateKey）存在性已由 Loader 保证；
  // 其结果类型兼容需实体表达式协议扩展，本轮不做静态检查（见 changelog 遗留问题）。
  if (!targetVar) return;
  const t = targetVar.type;
  if (t === 'string' || t === 'enum') {
    throw new ExpressionSemanticError(
      'UNSUPPORTED_FORMULA_TARGET_TYPE',
      `公式 target '${formula.target}' 的类型（${t}）不支持 v0.1 Formula`,
      validated.ast.span,
      formula.target,
    );
  }
  const need = t === 'boolean' ? 'boolean' : 'number'; // integer 目标只要求 numeric（静态阶段不证明整数值）
  if (validated.resultType !== need) {
    throw new ExpressionSemanticError(
      'FORMULA_RESULT_TYPE_MISMATCH',
      `公式结果类型 ${validated.resultType} 不能写入 target '${formula.target}'（${t}）`,
      validated.ast.span,
      formula.target,
    );
  }
}
