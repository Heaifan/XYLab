// R2-01 · 语义规则（变量域）：保留字、value 与 type 匹配、min/max/step 适用范围。

import type { LoadError } from '../loader-types';
import type { RawExperiment } from '../raw-types';

const RESERVED = new Set(['time', 'dt']);

function err(code: LoadError['code'], message: string, path: string): LoadError {
  return { code, message, path };
}

export function checkVariables(raw: RawExperiment, errors: LoadError[]): void {
  const vars = raw.variables ?? {};
  for (const [name, def] of Object.entries(vars)) {
    const base = `/variables/${name}`;
    if (RESERVED.has(name)) {
      errors.push(err('RESERVED_NAME', `变量名 '${name}' 是保留字（time/dt）`, base));
    }
    const v = def.value;
    switch (def.type) {
      case 'number':
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 类型 number，value 必须是有限数值`, `${base}/value`));
        }
        break;
      case 'integer':
        if (typeof v !== 'number' || !Number.isInteger(v)) {
          errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 类型 integer，value 必须是整数`, `${base}/value`));
        }
        break;
      case 'boolean':
        if (typeof v !== 'boolean') {
          errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 类型 boolean，value 必须是 true/false`, `${base}/value`));
        }
        break;
      case 'string':
        if (typeof v !== 'string') {
          errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 类型 string，value 必须是字符串`, `${base}/value`));
        }
        break;
      case 'enum': {
        const options = (def.options ?? []) as unknown[];
        if (!options.some((o) => o === v)) {
          errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 的 value 不在 options 内`, `${base}/value`));
        }
        break;
      }
      default:
        break; // type 合法性由 Schema 层保证
    }
    const hasNumeric = def.min !== undefined || def.max !== undefined || def.step !== undefined;
    if (hasNumeric && def.type !== 'number' && def.type !== 'integer') {
      errors.push(err('VARIABLE_TYPE_INVALID', `变量 '${name}' 的 min/max/step 仅适用于 number/integer 类型`, base));
    }
  }
}
