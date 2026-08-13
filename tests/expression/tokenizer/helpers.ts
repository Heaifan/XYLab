// R2-03A 测试共享工具（非 test 文件，避免 vitest 重复注册用例）。
import { tokenizeExpression } from '../../../src/expression/tokenizer';
import type { TokenType } from '../../../src/expression/token';

export function types(src: string): TokenType[] {
  return tokenizeExpression(src).map((t) => t.type);
}

export function pairs(src: string): Array<[TokenType, string]> {
  return tokenizeExpression(src).map((t) => [t.type, t.lexeme]);
}
