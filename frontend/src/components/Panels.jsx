import { Link } from 'react-router-dom';

/* Copy is the design's, verbatim — one variant per gated screen. */
const ROLE_COPY = {
  foods: {
    kicker: 'Chefs only',
    title: 'Prices are kept by the chefs',
    body: 'The master foods list is where ingredient costs live, so only chefs and the kitchen manager can open it. The menu and its prep detail are yours to read.'
  },
  builder: {
    kicker: 'Chefs only',
    title: 'Costing a dish is a chef’s job',
    body: 'The dish builder writes prices into the menu, so it stays with the chefs and the kitchen manager. You can read every costed dish on the menu.'
  },
  users: {
    kicker: 'Admins only',
    title: 'Staff accounts are managed by the kitchen manager',
    body: 'Ask her to add someone or reset a password. Nothing on this page is available to chefs or kitchen staff.'
  }
};

const fallbackCopy = (roles) => ({
  kicker: roles && roles.length === 1 && roles[0] === 'admin' ? 'Admins only' : 'Chefs only',
  title: 'This screen isn’t yours to open',
  body: 'Ask the kitchen manager if you need access.'
});

/**
 * Shown when the signed-in role can't have this screen — either the route
 * guard caught it, or the server returned 403.
 */
export function RolePanel({ variant, roles }) {
  const copy = ROLE_COPY[variant] || fallbackCopy(roles);
  return (
    <div
      style={{
        maxWidth: 520, margin: '60px auto', textAlign: 'center',
        border: '1px solid var(--ht-clay)', background: 'var(--ht-field)',
        borderRadius: 'var(--ht-radius-card)', padding: '40px 28px'
      }}
    >
      <img
        src="/assets/logo-badge.png" alt="Holiday Thyme"
        style={{ width: 44, height: 44, display: 'block', margin: '0 auto 20px' }}
      />
      <div style={{ fontSize: '10.5px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--ht-plum)', marginBottom: 12 }}>
        {copy.kicker}
      </div>
      <div style={{ fontFamily: 'var(--ht-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.3, marginBottom: 10, textWrap: 'balance' }}>
        {copy.title}
      </div>
      <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 24px', textWrap: 'pretty' }}>
        {copy.body}
      </p>
      <Link to="/" className="ht-pri" style={{ textDecoration: 'none' }}>Back to the dashboard</Link>
    </div>
  );
}

/**
 * The network / server-unreachable panel. `title` names what didn't load so
 * the message stays specific to the screen.
 */
export function UnreachablePanel({ title, onRetry }) {
  return (
    <div
      role="alert"
      style={{
        maxWidth: 520, margin: '60px auto', textAlign: 'center',
        border: '1px solid var(--ht-error-border)', background: 'var(--ht-error-bg)',
        borderRadius: 'var(--ht-radius-card)', padding: '40px 28px'
      }}
    >
      <div style={{ fontSize: '10.5px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--ht-plum)', marginBottom: 12 }}>
        Can’t reach the office
      </div>
      <div style={{ fontFamily: 'var(--ht-display)', fontSize: 23, fontWeight: 600, lineHeight: 1.3, marginBottom: 10, textWrap: 'balance' }}>
        {title}
      </div>
      <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 22px', textWrap: 'pretty' }}>
        The kitchen tablet may be off the network. Nothing was changed.
      </p>
      <button type="button" className="ht-pri" onClick={onRetry}>Try again</button>
    </div>
  );
}

/** Quiet placeholder while a screen's first fetch is in flight. */
export function LoadingPanel({ label = 'Loading…' }) {
  return (
    <div
      role="status"
      style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ht-body)', fontSize: '14.5px' }}
    >
      {label}
    </div>
  );
}
