"use client";

import { useEffect, useRef } from "react";

/** Native <dialog>: focus trap, Esc to close and backdrop come from the browser. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dlg" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="dlg-head"><h2 className="card-title">{title}</h2><button className="btn-link" onClick={onClose} aria-label="Close">✕</button></div>
      <div className="dlg-body">{children}</div>
    </dialog>
  );
}
