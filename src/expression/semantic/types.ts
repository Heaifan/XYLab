// R2-03C · 表达式语义类型系统。
// v0.1 只有三种语义类型：number / boolean / unsupported（string、enum 不参与 Formula）。
// number 与 integer 在表达式层统一视为 number；「3.7 能否写入 integer」是赋值边界的事（R2-04+）。

import type { ExpressionNode } from '../syntax/ast';
import type { SourceSpan } from '../syntax/ast';

export type SemanticType = 'number' | 'boolean';
export type SymbolType = SemanticType | 'unsupported';

export interface FunctionSignature {
  minArgs: number;
  maxArgs: number; // Infinity = 不限上限（min/max 变参）
  paramType: SemanticType;
  returnType: SemanticType;
}

export interface SemanticContext {
  variables: Map<string, SymbolType>;
  builtins: Map<string, SemanticType>;
  functions: Map<string, FunctionSignature>;
}

export interface ValidatedExpression {
  ast: ExpressionNode; // 只读引用：Semantic Validator 绝不改写 AST
  resultType: SemanticType;
}

export type SemanticErrorCode =
  | 'UNKNOWN_IDENTIFIER'
  | 'UNKNOWN_FUNCTION'
  | 'INVALID_OPERAND_TYPE'
  | 'INVALID_ARGUMENT_TYPE'
  | 'INVALID_ARGUMENT_COUNT'
  | 'FORMULA_RESULT_TYPE_MISMATCH'
  | 'UNSUPPORTED_SYMBOL_TYPE'
  | 'UNSUPPORTED_FORMULA_TARGET_TYPE';

export interface SemanticErrorInfo {
  code: SemanticErrorCode;
  message: string;
  span: SourceSpan;
  identifier?: string; // 涉及名称时携带（identifier / function / target）
}
