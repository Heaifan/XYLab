// R2-03A · 受限表达式语言词法分析器。
// 冻结范围：
//   数字：整数/小数（小数点两侧都必须有数字；不支持 .5 / 5. / 1e3 / 0xFF / NaN / Infinity）
//   标识符：^[A-Za-z_][A-Za-z0-9_]*$（true/false 识别为 BOOLEAN）
//   运算符：+ - * / % < > <= >= == != && || !（不支持 ^，幂统一用 pow()）
//   分隔符：( ) ,   空白（space/tab/CR/LF）全部忽略
// 明确失败：非法字符（含单独 = 、. 、& 、| 、^ ）→ INVALID_CHARACTER；非法数字 → INVALID_NUMBER。
// 不涉及：Parser / AST / 变量存在性 / 函数白名单（分别属于 R2-03B / R2-03C）；不使用 eval / Function。

import { ExpressionTokenizeError } from './errors';
import type { Token, TokenType } from './token';

const TWO_CHAR: Array<readonly [string, TokenType]> = [
  ['>=', 'GTE'],
  ['<=', 'LTE'],
  ['==', 'EQ'],
  ['!=', 'NEQ'],
  ['&&', 'AND'],
  ['||', 'OR'],
];

const ONE_CHAR: Record<string, TokenType> = {
  '+': 'PLUS',
  '-': 'MINUS',
  '*': 'STAR',
  '/': 'SLASH',
  '%': 'PERCENT',
  '<': 'LT',
  '>': 'GT',
  '!': 'NOT',
  '(': 'LPAREN',
  ')': 'RPAREN',
  ',': 'COMMA',
};

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}
function isIdentStart(c: string): boolean {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c === '_';
}
function isIdentChar(c: string): boolean {
  return isIdentStart(c) || isDigit(c);
}
function isWhitespace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\r' || c === '\n';
}

function mk(type: TokenType, lexeme: string, start: number, end: number): Token {
  return { type, lexeme, span: { start, end } };
}

export function tokenizeExpression(source: string): Token[] {
  const tokens: Token[] = [];
  const n = source.length;
  let i = 0;

  while (i < n) {
    const c = source[i];

    // 空白：忽略
    if (isWhitespace(c)) {
      i++;
      continue;
    }

    // 1) 双字符运算符（longest match：>= 绝不拆成 > =）
    const two = TWO_CHAR.find(([lex]) => source.startsWith(lex, i));
    if (two) {
      tokens.push(mk(two[1], two[0], i, i + 2));
      i += 2;
      continue;
    }

    // 2) 单字符运算符 / 分隔符
    const one = ONE_CHAR[c];
    if (one) {
      tokens.push(mk(one, c, i, i + 1));
      i++;
      continue;
    }

    // 3) 数字
    if (isDigit(c)) {
      const start = i;
      while (i < n && isDigit(source[i])) i++;
      if (i < n && source[i] === '.') {
        i++;
        if (i >= n || !isDigit(source[i])) {
          // `5.` / `5.x`：小数点后必须有数字
          throw new ExpressionTokenizeError('INVALID_NUMBER', `非法数字 '${source.slice(start, Math.min(i + 1, n))}'：小数点后必须有数字`, start);
        }
        while (i < n && isDigit(source[i])) i++;
      }
      // 数字后紧跟数字/字母/下划线/点 → 明确失败（覆盖 1.2.3、1e3、123abc）
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

    // 4) 标识符 / 布尔字面量
    if (isIdentStart(c)) {
      const start = i;
      while (i < n && isIdentChar(source[i])) i++;
      const lexeme = source.slice(start, i);
      const type: TokenType = lexeme === 'true' || lexeme === 'false' ? 'BOOLEAN' : 'IDENTIFIER';
      tokens.push(mk(type, lexeme, start, i));
      continue;
    }

    // 5) 非法字符（含单独 = 、. 、& 、| 、^ 、$ …）→ 明确失败并携带位置
    throw new ExpressionTokenizeError('INVALID_CHARACTER', `Unexpected character '${c}' at position ${i}`, i);
  }

  tokens.push(mk('EOF', '', n, n));
  return tokens;
}
