import { useId } from 'react';

/**
 * Label + control + inline error.
 *
 * `error` is the string from `err.fields[name]` on a validation 400 — the key
 * matches the input name, so a form can pass them straight through.
 */
export function FormField({ label, name, error, hint, children }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <label htmlFor={id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ht-body)' }}>
        {label}
      </span>

      {typeof children === 'function'
        ? children({ id, name, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy })
        : children}

      {error ? (
        <span id={`${id}-err`} role="alert" style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ht-error-text)' }}>
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ht-body)' }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

/** Form-level error — the `err.message` a validation or business 400 carries. */
export function FormError({ children }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        border: '1px solid var(--ht-error-border)', background: 'var(--ht-error-bg)',
        borderRadius: 'var(--ht-radius-field)', padding: '13px 15px',
        animation: 'ht-shake 0.4s ease'
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 'var(--ht-radius-pill)', background: 'var(--ht-plum)', marginTop: 7, flexShrink: 0 }} />
      <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ht-error-text)' }}>{children}</span>
    </div>
  );
}
