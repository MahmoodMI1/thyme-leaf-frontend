const stepStyle = (disabled) => ({
  padding: '0 14px', minHeight: 44, borderRadius: 'var(--ht-radius-sec)',
  fontFamily: 'var(--ht-body-font)', fontSize: 13.5, fontWeight: 700,
  background: 'none', border: '1.5px solid var(--ht-olive)',
  color: 'var(--ht-olive)', cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.4 : 1
});

const pageStyle = (current) => ({
  minWidth: 40, minHeight: 44, padding: '0 12px',
  borderRadius: 'var(--ht-radius-sec)',
  fontFamily: 'var(--ht-body-font)', fontSize: 13.5,
  fontWeight: current ? 700 : 500,
  background: current ? '#F3EFE4' : 'none',
  border: '1px solid ' + (current ? 'var(--ht-clay)' : 'transparent'),
  color: 'var(--ht-ink)', cursor: 'pointer'
});

/** Client-side paging — the backend returns whole lists. */
export function Pagination({ page, pageCount, rangeLabel, onGo }) {
  if (pageCount <= 1) return null;

  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 14, marginTop: 22,
        paddingTop: 18, borderTop: '1px solid var(--ht-hairline)'
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--ht-body)' }}>{rangeLabel}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => onGo(page - 1)} disabled={page === 1} style={stepStyle(page === 1)}>
          Previous
        </button>
        {Array.from({ length: pageCount }, (_, n) => (
          <button key={n} type="button" onClick={() => onGo(n + 1)} style={pageStyle(n + 1 === page)}>
            {n + 1}
          </button>
        ))}
        <button type="button" onClick={() => onGo(page + 1)} disabled={page === pageCount} style={stepStyle(page === pageCount)}>
          Next
        </button>
      </div>
    </div>
  );
}
