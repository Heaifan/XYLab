// XYLab 治理门禁（底线位 · 5 + 100 自动检查；SRP 为人工硬门禁）。
// 规则（宪法 Article 4）：
//   100：手写源码（.ts/.tsx/.js/.jsx/.mjs/.css，含测试与脚本）物理行数 ≤ 100，禁止压缩作弊。
//   5：职责目录内手写实现文件 ≤ 5（第 6 个出现前必须先审职责边界）。
// 排除：node_modules/.git/dist/coverage/生成物/lock 文件；schema/示例/知识文档/资源文件不在扫描范围。
// 无 allowlist、无 grandfather、无 exception。

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_EXT = /\.(ts|tsx|js|jsx|mjs|css)$/;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', 'generated']);
const SCAN_ROOTS = ['src', 'tests', 'scripts'];

export function lineCount(p) {
  const lines = readFileSync(p, 'utf-8').split(/\r?\n/);
  return lines.length > 0 && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
}

export function scanProject(root = ROOT) {
  const files = [];
  const dirs = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      if (SKIP_DIRS.has(name)) continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        dirs.push(p);
        walk(p);
      } else if (SRC_EXT.test(name)) {
        files.push(p);
      }
    }
  }
  for (const r of SCAN_ROOTS) walk(join(root, r));

  const problems = [];
  for (const f of files) {
    const n = lineCount(f);
    if (n > 100) problems.push(`[100] ${relative(root, f)}: ${n} 行（> 100）`);
  }
  for (const d of dirs) {
    const cnt = files.filter((f) => dirname(f) === d).length;
    if (cnt > 5) problems.push(`[5] ${relative(root, d)}: ${cnt} 个实现文件（> 5）`);
  }
  return { files, dirs, problems };
}

export function runGuard(root = ROOT) {
  const { files, problems } = scanProject(root);
  if (problems.length > 0) {
    console.error(`GOVERNANCE FAIL（${problems.length} 处违规）`);
    for (const p of problems) console.error('  ' + p);
    process.exitCode = 1;
    return false;
  }
  console.log(`GOVERNANCE PASS：${files.length} 个源码文件 ≤ 100 行；职责目录 ≤ 5 文件`);
  return true;
}

// CLI 入口：直接执行时运行门禁
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runGuard();
}
