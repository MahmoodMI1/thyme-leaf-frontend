/** Search + filters + count, above a table or grid. */
export function Toolbar({ children }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, ...rest }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        flex: '1 1 220px', minWidth: 0, minHeight: 44, padding: '10px 14px',
        fontFamily: 'var(--ht-body-font)', fontSize: 15, color: 'var(--ht-ink)',
        background: 'var(--ht-field)', border: '1px solid var(--ht-hairline)',
        borderRadius: 'var(--ht-radius-field)', outline: 'none'
      }}
      {...rest}
    />
  );
}

export function CountLabel({ children }) {
  return (
    <span style={{ fontSize: 13, color: 'var(--ht-body)', whiteSpace: 'nowrap' }}>{children}</span>
  );
}

export function Select({ value, onChange, options, ...rest }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        minHeight: 44, padding: '6px 10px',
        fontFamily: 'var(--ht-body-font)', fontSize: 14, color: 'var(--ht-ink)',
        background: 'var(--ht-field)', border: '1px solid var(--ht-hairline)',
        borderRadius: 'var(--ht-radius-sec)', cursor: 'pointer'
      }}
      {...rest}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
