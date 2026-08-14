// BATCH-2 · XYUI-7 7.01 Compact Confirm：危险删除才阻塞确认。
import { useEffect, useRef } from 'react';
interface Props { open: boolean; title: string; message: string; confirmText: string; onConfirm: () => void; onCancel: () => void; }
export function ConfirmDialog(p: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current; if (!dialog) return;
    if (p.open && !dialog.open) dialog.showModal();
    if (!p.open && dialog.open) dialog.close();
  }, [p.open]);
  return <dialog ref={ref} className="xy-dialog" onCancel={(e) => { e.preventDefault(); p.onCancel(); }}>
    <h2>{p.title}</h2><p>{p.message}</p>
    <div className="xy-dialog-actions">
      <button autoFocus onClick={p.onCancel}>取消</button>
      <button className="danger" onClick={p.onConfirm}>{p.confirmText}</button>
    </div>
  </dialog>;
}
