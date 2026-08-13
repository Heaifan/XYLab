// R2-03A · 受限表达式语言词法分析器（扫描算法；词法规则表见 ./lexical-rules）。
// 冻结范围：整数/小数（小数点两侧必须有数字，不支持 .5/5./1e3/0xFF/NaN/Infinity）、
// 标识符 ^[A-Za-z_][A-Za-z0-9_]*$（true/false → BOOLEAN）、算术/比较/逻辑运算符、
// 括号与逗号、空白忽略。非法字符/非法数字明确失败并携带 position。
// 不涉及 Parser/AST/变量存在性/函数白名单（R2-03B/C）；不使用 eval / Function。

import { ExpressionTokenizeError } from './errors';
import { ONE_CHAR, TWO_CHAR, isDigit, isIdentChar, isIdentStart, isWhitespace, mk } from './lexical-rules';
import type { Token, TokenType } from './token';

export function tokenizeExpression(source: string): Token[] {
  const tokens: Token[] = [];
  const n = source.length;
  let i = 0;

  while (i < n) {
    const c = source[i];

    if (isWhitespace(c)) {
      i++;
      continue;
    }

    // 双字符运算符（longest match：>= 绝不拆成 > =）
    const two = TWO_CHAR.find(([lex]) => source.startsWith(lex, i));
    if (two) {
      tokens.push(mk(two[1], two[0], i, i + 2));
      i += 2;
      continue;
    }

    // 单字符运算符 / 分隔符
    const one = ONE_CHAR[c];
    if (one) {
      tokens.push(mk(one, c, i, i + 1));
      i++;
      continue;
    }

    // 数字
    if (isDigit(c)) {
      const start = i;
      while (i < n && isDigit(source[i])) i++;
      if (i < n && source[i] === '.') {
        i++;
        if (i >= n || !isDigit(source[i])) {
          // `5.` / `5.x`：小数点后必须有数字
          throw new ExpressionTokenizeError(
            'INVALID_NUMBER',
            `非法数字 '${source.slice(start, Math.min(i + 1, n))}'：小数点后必须有数字`,
            start,
          );
        }
        while (i < n && isDigit(source[i])) i++;
      }
      // 数字后紧跟数字/字母/下划线/点 → 明确失败（1.2.3、1e3、123abc）
      if (i < n && (isDigit(source[i]) || isIdentChar(source[i]) || source[i] === '.')) {
        throw new ExpressionTokenizeError(
          'INVALID_NUMBER',
          `非法数字 '${source.slice(start)}'（不支持科学计数法/多小数点/数字粘连标识符）`,
          start,
        );
      }
      tokens.push(mk('NUMBER', source.slice(start, i), start, i));
      continue;
    }

    // 标识符 / 布尔字面量
    if (isIdentStart(c)) {
      const start = i;
      while (i < n && isIdentChar(source[i])) i++;
      const lexeme = source.slice(start, i);
      const type: TokenType = lexeme === 'true' || lexeme === 'false' ? 'BOOLEAN' : 'IDENTIFIER';
      tokens.push(mk(type, lexeme, start, i));
      continue;
    }

    // 非法字符（含单独 = . & | ^ $ …）→ 明确失败并携带位置
    throw new ExpressionTokenizeError('INVALID_CHARACTER', `Unexpected character '${c}' at position ${i}`, i);
  }

  tokens.push(mk('EOF', '', n, n));
  return tokens;
}
