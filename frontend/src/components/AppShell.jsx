import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../auth/useSession.js';
import { allowed } from '../lib/nav.js';
import { RolePill } from './RolePill.jsx';

const linkStyle = (current) => ({
  padding: '8px 11px', borderRadius: 'var(--ht-radius-pill)', fontSize: '13.5px',
  whiteSpace: 'nowrap',
  fontWeight: current ? 700 : 500,
  color: current ? 'var(--ht-ink)' : 'var(--ht-body)',
  background: current ? '#F3EFE4' : 'none'
});

function NavLinks() {
  const { user } = useSession();
  const pages = allowed(user?.role);
  return pages.map(p => (
    <NavLink key={p.key} to={p.href} end={p.href === '/'} style={({ isActive }) => linkStyle(isActive)}>
      {p.label}
    </NavLink>
  ));
}

/** Sticky header, role-painted nav, and the signed-in identity. */
export function AppShell() {
  const { user, signOut } = useSession();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ht-bg)' }}>
      <header className="ht-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: '0 0 auto' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ht-ink)' }}>
            <img src="/assets/logo-badge.png" alt="Holiday Thyme" style={{ width: 38, height: 38, display: 'block' }} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontFamily: 'var(--ht-display)', fontSize: 18, fontWeight: 600 }}>Holiday Thyme</span>
              <span style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginTop: 4 }}>
                Kitchen Operations
              </span>
            </span>
          </Link>
        </span>

        <nav className="ht-nav" aria-label="Sections">
          <NavLinks />
        </nav>

        <div className="ht-act">
          {user ? (
            <>
              <span style={{ display: 'none', alignItems: 'center', gap: 8 }} className="ht-whoami">
                <span style={{ fontSize: 13, fontWeight: 700 }}>{user.username}</span>
                <RolePill role={user.role} />
              </span>
              <button
                type="button"
                className="ht-sec"
                onClick={signOut}
                style={{ borderWidth: 1, fontSize: 13 }}
              >
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </header>

      <nav className="ht-nav-mobile" aria-label="Sections">
        <NavLinks />
      </nav>

      <main key={location.pathname} className="ht-page">
        <Outlet />
      </main>
    </div>
  );
}
