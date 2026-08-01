export function EmptyState({ title, body, action }) {
  return (
    <div
      style={{
        textAlign: 'center', padding: '54px 24px',
        border: '1px dashed var(--ht-clay)', borderRadius: 'var(--ht-radius-card)',
        background: 'var(--ht-field)'
      }}
    >
      <div style={{ fontFamily: 'var(--ht-display)', fontSize: 21, fontWeight: 600, marginBottom: 8, textWrap: 'balance' }}>
        {title}
      </div>
      <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', margin: 0, textWrap: 'pretty' }}>
        {body}
      </p>
      {action ? <div style={{ marginTop: 20 }}>{action}</div> : null}
    </div>
  );
}
