// BATCH-2 · XYUI-4 状态文字+颜色双通道的轻量操作反馈。
export interface FeedbackState { text: string; ok: boolean; }
export function ActionFeedback({ feedback }: { feedback: FeedbackState | null }) {
  if (!feedback) return null;
  return <span className={`feedback ${feedback.ok ? 'feedback-ok' : 'feedback-err'}`} role="status">
    {feedback.ok ? '✓' : '✕'} {feedback.text}
  </span>;
}
