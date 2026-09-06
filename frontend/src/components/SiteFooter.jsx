import { Link } from 'react-router-dom';

export const COPYRIGHT_YEAR = 2026;

const linkStyle = { color: 'var(--ht-muted)', textDecoration: 'underline', textUnderlineOffset: 3 };

/**
 * Ownership per the development agreement (§7): the software and its
 * copyright are the developer's; Holiday Thyme holds a perpetual licence and
 * owns every piece of business data inside it. The footer says both.
 */
export function SiteFooter({ compact = false }) {
  return (
    <footer
      style={{
        maxWidth: 1160, margin: '0 auto',
        padding: compact ? '22px 0 0' : '28px 20px 40px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '8px 18px', fontSize: compact ? 12 : 13, lineHeight: 1.6, color: 'var(--ht-muted)',
        borderTop: compact ? 'none' : '1px solid var(--ht-hairline)'
      }}
    >
      <span>
        Software © {COPYRIGHT_YEAR} Mahmood Idelbi · built for Holiday Thyme
      </span>
      <nav aria-label="Legal" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
        <Link to="/legal#privacy" style={linkStyle}>Privacy</Link>
        <Link to="/legal#terms" style={linkStyle}>Terms of use</Link>
        <Link to="/legal#cookies" style={linkStyle}>Cookies</Link>
        <Link to="/legal#credits" style={linkStyle}>Credits</Link>
      </nav>
    </footer>
  );
}
