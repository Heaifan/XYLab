// F2 · 图标层（XYUI Foundation.Icon 0.15 冻结风格：Outline / Stroke 1.5 / Round Cap·Join / 16 DIP 默认）。
// glyph 注册表上游缺失（XYUI1-GAP-001）：按冻结风格内联 SVG 作消费层权宜，不造第二套 IconFont/glyph 命名权威。
// 所有按钮保持 Icon + Text（不做纯图标按钮）；图标 aria-hidden，语义由文字承担。
import type { ReactNode } from 'react';

function make(nodes: ReactNode) {
  return function Icon({ size = 16 }: { size?: number }) {
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {nodes}
      </svg>
    );
  };
}

export const IconPlay = make(<path d="M5.2 3.2v9.6L13 8 5.2 3.2Z" />);
export const IconPause = make(<path d="M5.6 3.6v8.8M10.4 3.6v8.8" />);
export const IconResume = make(
  <>
    <path d="M13.4 8a5.4 5.4 0 1 1-1.6-3.8" />
    <path d="M13.6 1.8v2.6H11" />
    <path d="M6.6 5.9v4.2L10.2 8 6.6 5.9Z" />
  </>
);
export const IconStepForward = make(
  <>
    <path d="M4 3.6 10.6 8 4 12.4V3.6Z" />
    <path d="M12.4 3.6v8.8" />
  </>
);
export const IconStop = make(<path d="M4.2 4.2h7.6v7.6H4.2Z" />);
export const IconReset = make(
  <>
    <path d="M2.6 8a5.4 5.4 0 1 0 1.6-3.8" />
    <path d="M2.4 1.8v2.6H5" />
  </>
);
export const IconPin = make(
  <>
    <path d="M6.2 2.2h3.6l-.6 4.2 2.4 2.2H4.4l2.4-2.2-.6-4.2Z" />
    <path d="M8 8.6v5" />
  </>
);
export const IconPinOff = make(
  <>
    <path d="M6.2 2.2h3.6l-.6 4.2 2.4 2.2H4.4l2.4-2.2-.6-4.2Z" />
    <path d="M3 2.6l10 10.8" />
  </>
);
export const IconLock = make(
  <>
    <path d="M4.4 7.2h7.2v6H4.4Z" />
    <path d="M5.8 7.2V5.4a2.2 2.2 0 0 1 4.4 0v1.8" />
  </>
);
export const IconUnlock = make(
  <>
    <path d="M4.4 7.2h7.2v6H4.4Z" />
    <path d="M5.8 7.2V5.4a2.2 2.2 0 0 1 4.3-.7" />
  </>
);
export const IconEye = make(
  <>
    <path d="M1.8 8S4.2 4.2 8 4.2 14.2 8 14.2 8 11.8 11.8 8 11.8 1.8 8 1.8 8Z" />
    <circle cx="8" cy="8" r="1.9" />
  </>
);
export const IconEyeOff = make(
  <>
    <path d="M1.8 8S4.2 4.2 8 4.2 14.2 8 14.2 8 11.8 11.8 8 11.8 1.8 8 1.8 8Z" />
    <path d="M3 2.8l10 10.4" />
  </>
);
export const IconChart = make(
  <>
    <path d="M2.6 2.6v10.8h10.8" />
    <path d="M4.8 10.6 7.2 7.6l1.9 1.9 3-4.6" />
  </>
);
export const IconChevronDown = make(<path d="M4 6.2 8 10.2l4-4" />);
export const IconChevronRight = make(<path d="M6.2 4l4 4-4 4" />);
export const IconWarn = make(
  <>
    <path d="M8 2.4 14.4 13.4H1.6L8 2.4Z" />
    <path d="M8 6.6v3M8 11.4v.2" />
  </>
);
export const IconDeltaUp = make(<path d="M8 3.8 12.8 11.8H3.2L8 3.8Z" />);
export const IconDeltaDown = make(<path d="M8 12.2 3.2 4.2h9.6L8 12.2Z" />);
