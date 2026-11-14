'use client';
// Checklist board: A clipboard checklist: the row under the pointer and every row above it get ticked, one after another.
// Liniqo Live interactive figure (https://liniqo.com). Fills its parent's width; move the pointer over it.
// Brand colours: line #1f6b5a (primary-600), accent #faa104 (secondary-600). The data-key is Liniqo's sealed embed token, not the licence key.
import { useEffect, useRef } from 'react';

const SRC = 'https://liniqo.com/live/embed.js';

export default function ChecklistBoard({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current as (HTMLDivElement & { __liniqo?: { destroy(): void }; __lq?: number }) | null;
    const w = window as unknown as { LiniqoLive?: { scan(root?: Element): void } };
    if (w.LiniqoLive) w.LiniqoLive.scan(el?.parentElement ?? undefined);
    else if (!document.querySelector(`script[src="${SRC}"]`)) {
      const s = document.createElement('script');
      s.src = SRC; s.async = true;
      document.head.appendChild(s); // mounts every [data-liniqo] on load, and any added later
    }
    return () => {
      if (!el) return;
      el.__liniqo?.destroy();
      el.__liniqo = undefined; el.__lq = 0; // lets a remount (React Strict Mode, route changes) draw it again
    };
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      data-liniqo="checklist-board"
      data-key="lq1.mmAbYdLQ4CnQ3AFr5Yo9nnbauUV9Id4-d0_OYQsmB-TxB9B1ufygEjH-CBsnswHHYChsRZ-Qn7xXP4NBTu78K0kBxLtndVfcXdeTtj09dtwFaWvZYKDiPQ"
      data-accent="#faa104"
      data-line="#1f6b5a"
      data-theme="light"
      data-intensity="0.6"
      aria-hidden="true"
    />
  );
}
