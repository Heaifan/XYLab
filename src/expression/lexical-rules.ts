// R2-03A · 词法规则表：运算符表与字符分类。扫描算法见 ./tokenizer。

import type { Token, TokenType } from './token';

export const TWO_CHAR: Array<readonly [string, TokenType]> = [
  ['>=', 'GTE'],
  ['<=', 'LTE'],
  ['==', 'EQ'],
  ['!=', 'NEQ'],
  ['&&', 'AND'],
  ['||', 'OR'],
];

export const ONE_CHAR: Record<string, TokenType> = {
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

export function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

export function isIdentStart(c: string): boolean {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c === '_';
}

export function isIdentChar(c: string): boolean {
  return isIdentStart(c) || isDigit(c);
}

export function isWhitespace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\r' || c === '\n';
}

export function mk(type: TokenType, lexeme: string, start: number, end: number): Token {
  return { type, lexeme, span: { start, end } };
}
