// R2-03C · C2/C3 类型推导：对只读 AST 递归推导语义类型。
// 冻结规则（禁止一切隐式类型转换，XYLab 是实验 DSL 不是 JavaScript）：
//   算术 + - * / %：number × number → number
//   一元 -：number → number；一元 !：boolean → boolean（无 truthy/falsy）
//   比较 < <= > >=：number ↔ number → boolean
//   相等 == !=：同类型（number↔number、boolean↔boolean）→ boolean，跨类型拒绝
//   逻辑 && ||：boolean × boolean → boolean
// 未知名称 → UNKNOWN_IDENTIFIER（绝不默认值）；string/enum 符号 → UNSUPPORTED_SYMBOL_TYPE。

import type { ExpressionNode } from '../syntax/ast';
import type { SemanticContext, SemanticType } from './types';
import { ExpressionSemanticError } from './errors';

function fail(code: ExpressionSemanticError['code'], message: string, node: ExpressionNode, identifier?: string): never {
  throw new ExpressionSemanticError(code, message, node.span, identifier);
}

export function inferType(node: ExpressionNode, ctx: SemanticContext): SemanticType {
  switch (node.type) {
    case 'NumberLiteral':
      return 'number';
    case 'BooleanLiteral':
      return 'boolean';
    case 'Identifier': {
      const v = ctx.variables.get(node.name);
      if (v !== undefined) {
        if (v === 'unsupported') {
          return fail('UNSUPPORTED_SYMBOL_TYPE', `符号 '${node.name}' 的类型（string/enum）不支持参与 v0.1 表达式`, node, node.name);
        }
        return v;
      }
      const b = ctx.builtins.get(node.name);
      if (b !== undefined) return b;
      return fail('UNKNOWN_IDENTIFIER', `未知标识符 '${node.name}'`, node, node.name);
    }
    case 'UnaryExpression': {
      const t = inferType(node.operand, ctx);
      if (node.operator === '!') {
        if (t !== 'boolean') return fail('INVALID_OPERAND_TYPE', `一元 '!' 要求 boolean 操作数，得到 ${t}`, node);
        return 'boolean';
      }
      if (t !== 'number') return fail('INVALID_OPERAND_TYPE', `一元 '-' 要求 number 操作数，得到 ${t}`, node);
      return 'number';
    }
    case 'BinaryExpression': {
      const lt = inferType(node.left, ctx);
      const rt = inferType(node.right, ctx);
      const op = node.operator;
      if (op === '+' || op === '-' || op === '*' || op === '/' || op === '%') {
        if (lt !== 'number' || rt !== 'number') {
          return fail('INVALID_OPERAND_TYPE', `运算符 '${op}' 要求 number × number，得到 ${lt} × ${rt}`, node);
        }
        return 'number';
      }
      if (op === '<' || op === '<=' || op === '>' || op === '>=') {
        if (lt !== 'number' || rt !== 'number') {
          return fail('INVALID_OPERAND_TYPE', `比较 '${op}' 只支持 number ↔ number，得到 ${lt} ↔ ${rt}`, node);
        }
        return 'boolean';
      }
      if (op === '==' || op === '!=') {
        if (lt !== rt) return fail('INVALID_OPERAND_TYPE', `相等比较 '${op}' 两侧类型必须一致，得到 ${lt} 与 ${rt}`, node);
        return 'boolean';
      }
      if (lt !== 'boolean' || rt !== 'boolean') {
        return fail('INVALID_OPERAND_TYPE', `逻辑 '${op}' 要求 boolean × boolean，得到 ${lt} × ${rt}`, node);
      }
      return 'boolean';
    }
    case 'CallExpression': {
      const sig = ctx.functions.get(node.callee);
      if (!sig) return fail('UNKNOWN_FUNCTION', `未知函数 '${node.callee}'`, node, node.callee);
      if (node.arguments.length < sig.minArgs || node.arguments.length > sig.maxArgs) {
        return fail('INVALID_ARGUMENT_COUNT', `函数 '${node.callee}' 参数数量 ${node.arguments.length}，要求 ${sig.minArgs}~${sig.maxArgs}`, node, node.callee);
      }
      for (const arg of node.arguments) {
        const at = inferType(arg, ctx);
        if (at !== sig.paramType) {
          return fail('INVALID_ARGUMENT_TYPE', `函数 '${node.callee}' 参数要求 ${sig.paramType}，得到 ${at}`, arg, node.callee);
        }
      }
      return sig.returnType;
    }
  }
}
