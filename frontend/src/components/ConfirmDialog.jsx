import { useEffect } from 'react';

/**
 * Destructive confirmation. Escape and a backdrop click both cancel, so the
 * safe way out is always the easy one.
 */
export function ConfirmDialog({ kicker, title, body, confirmLabel, cancelLabel = 'Keep it', onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, zIndex: 70,
          background: 'rgba(60,55,45,0.45)'
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        style={{
          position: 'fixed', zIndex: 71, top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 40px)', maxWidth: 420,
          background: 'var(--ht-bg)', border: '1px solid var(--ht-clay)',
          borderRadius: 'var(--ht-radius-card)', padding: '26px 24px'
        }}
      >
        <div style={{ fontSize: '10.5px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--ht-plum)', marginBottom: 12 }}>
          {kicker}
        </div>
        <div style={{ fontFamily: 'var(--ht-display)', fontSize: 23, fontWeight: 600, lineHeight: 1.3, marginBottom: 10, textWrap: 'balance' }}>
          {title}
        </div>
        <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 22px', textWrap: 'pretty' }}>
          {body}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="ht-sec" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="ht-pri" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </>
  );
}
