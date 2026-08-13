// UI-F1 · 断点 Hook：matchMedia 监听 + getBreakpoint 纯函数（逻辑唯一来源，禁止两处判断）。
import { useEffect, useState } from 'react';
import { getBreakpoint } from './breakpoints';
import type { Breakpoint } from './breakpoints';

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => getBreakpoint(window.innerWidth));

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1px)'); // 任意媒体查询：只借用其 change 事件机制
    const onResize = () => setBp(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', onResize);
    media.addEventListener('change', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      media.removeEventListener('change', onResize);
    };
  }, []);

  return bp;
}
