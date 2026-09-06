import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from './useSession.js';
import { PASSWORD_MIN_LENGTH } from '../api/users-api.js';
import { SiteFooter } from '../components/SiteFooter.jsx';

const MISMATCH = 'That username and password don’t match. Please try again.';

const fieldStyle = (invalid) => ({
  width: '100%', minHeight: 52, padding: '14px 16px',
  fontFamily: 'var(--ht-body-font)', fontSize: '15.5px', color: 'var(--ht-ink)',
  background: 'var(--ht-field)', borderRadius: 'var(--ht-radius-field)', outline: 'none',
  border: '1px solid ' + (invalid ? 'var(--ht-plum)' : 'var(--ht-hairline)'),
  transition: 'border-color .18s ease, box-shadow .18s ease'
});

const labelStyle = {
  fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--ht-body)'
};

export function LoginScreen() {
  const { user, status, signIn } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const nav = location.state || {};
  const from = nav.from || '/';

  // Already signed in — don't show the form at all.
  if (status === 'ready' && user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      return setError('Please enter both your username and password.');
    }
    // Too short to be a real password — fail with the same vague message the
    // server uses, so the form can't be used to probe account rules.
    if (password.length < PASSWORD_MIN_LENGTH) return setError(MISMATCH);

    setError(null);
    setBusy(true);
    try {
      await signIn(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setBusy(false);
      // The backend's message is the intended copy: 401 is the vague mismatch,
      // 403 explains the account is deactivated.
      setError(err && err.status ? (err.message || MISMATCH) : 'Can’t reach the office. Check the connection and try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ht-bg)' }}>
      <div className="ht-login-wrap" style={{ width: '100%', maxWidth: 430, margin: '0 auto', animation: 'ht-rise 0.6s ease both' }}>

        <div className="ht-login-aside">
          <img src="/assets/logo-badge.png" alt="Holiday Thyme" style={{ width: 58, height: 58, display: 'block' }} />
          <div>
            <div style={{ fontSize: '10.5px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--ht-gold)', marginBottom: 16 }}>
              Kitchen Operations
            </div>
            <div style={{ fontFamily: 'var(--ht-display)', fontSize: 34, fontWeight: 600, lineHeight: 1.3, textWrap: 'balance' }}>
              The walk-in,<br />the prep list,<br />the roster.
            </div>
            <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-on-dark)', margin: '16px 0 0', textWrap: 'pretty' }}>
              Sign in to check ingredients on hand and who’s on the line this week.
            </p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ht-on-dark)' }}>Holiday Thyme · staff only</div>
        </div>

        <div className="ht-login-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 34 }}>
            <img src="/assets/logo-badge.png" alt="Holiday Thyme sprig logo" style={{ width: 42, height: 42, display: 'block' }} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontFamily: 'var(--ht-display)', fontSize: 21, fontWeight: 600 }}>Holiday Thyme</span>
              <span style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginTop: 4 }}>
                Catering &amp; Fleur Teas
              </span>
            </span>
          </div>

          <div style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 12 }}>
            Kitchen staff access
          </div>
          <h1 style={{ fontFamily: 'var(--ht-display)', fontSize: 32, fontWeight: 600, lineHeight: 1.25, margin: '0 0 28px', textWrap: 'balance' }}>
            Welcome back
          </h1>

          {nav.expired && !error ? (
            <div
              role="status"
              style={{
                border: '1px solid var(--ht-clay)', background: 'var(--ht-field)',
                borderRadius: 'var(--ht-radius-field)', padding: '13px 15px', marginBottom: 22,
                fontSize: 14, lineHeight: 1.6, color: 'var(--ht-body)'
              }}
            >
              Your session ended. Sign in again and we’ll take you back to where you were.
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                border: '1px solid var(--ht-error-border)', background: 'var(--ht-error-bg)',
                borderRadius: 'var(--ht-radius-field)', padding: '13px 15px', marginBottom: 22,
                animation: 'ht-shake 0.4s ease'
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 'var(--ht-radius-pill)', background: 'var(--ht-plum)', marginTop: 7, flexShrink: 0 }} />
              <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ht-error-text)' }}>{error}</span>
            </div>
          ) : null}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                autoComplete="username"
                placeholder="Your kitchen username"
                style={fieldStyle(!!error)}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>Password</span>
              <span style={{ position: 'relative', display: 'block' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{ ...fieldStyle(!!error), paddingRight: 82 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    height: 44, padding: '0 14px', background: 'none', border: 'none',
                    color: 'var(--ht-olive)', fontFamily: 'var(--ht-body-font)', fontSize: '12.5px',
                    fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer'
                  }}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: -2 }}>
              <button
                type="button"
                onClick={() => setHelpOpen(v => !v)}
                style={{
                  background: 'none', border: 'none', padding: 0, minHeight: 44,
                  fontFamily: 'var(--ht-body-font)', fontSize: 14, fontWeight: 600,
                  color: 'var(--ht-plum)', cursor: 'pointer'
                }}
              >
                Forgot password?
              </button>
            </div>

            {helpOpen ? (
              <div style={{ border: '1px solid var(--ht-hairline)', background: 'var(--ht-field)', borderRadius: 'var(--ht-radius-field)', padding: '14px 16px', marginTop: -4 }}>
                <div style={{ fontSize: '10.5px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 8 }}>
                  Ask the kitchen manager
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ht-body)', margin: 0, textWrap: 'pretty' }}>
                  Accounts and password resets are handled by the kitchen manager — there’s no self-service reset. Message your{' '}
                  <strong style={{ fontWeight: 600, color: 'var(--ht-ink)' }}>kitchen manager</strong> and they’ll set a temporary password you can change after signing in.
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              style={{
                background: 'var(--ht-plum)', color: 'var(--ht-bg)', border: 'none',
                borderRadius: 'var(--ht-radius-pill)', padding: 17, minHeight: 44,
                fontFamily: 'var(--ht-body-font)', fontSize: 16, fontWeight: 700,
                cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1
              }}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ height: 1, background: 'var(--ht-hairline)', margin: '30px 0 22px' }} />

          <p style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'var(--ht-body)', textAlign: 'center', margin: 0 }}>
            Staff accounts are set up by the kitchen manager.{' '}
            <button
              type="button"
              onClick={() => setHelpOpen(v => !v)}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontFamily: 'var(--ht-body-font)', fontSize: '13.5px', fontWeight: 600,
                color: 'var(--ht-plum)', cursor: 'pointer'
              }}
            >
              Ask for access
            </button>.
          </p>

          <SiteFooter compact />
        </div>

      </div>
    </div>
  );
}
