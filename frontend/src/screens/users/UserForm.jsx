import { useEffect, useState } from 'react';
import { createUser, PASSWORD_MIN_LENGTH, ROLES, suggestPassword } from '../../api/users-api.js';
import { FormError } from '../../components/FormField.jsx';

const fieldStyle = {
  flex: '1 1 240px', minWidth: 0, minHeight: 44, padding: '10px 15px',
  fontFamily: 'var(--ht-body-font)', fontSize: 15, color: 'var(--ht-ink)',
  background: 'var(--ht-field)', border: '1px solid var(--ht-hairline)',
  borderRadius: 'var(--ht-radius-field)', outline: 'none'
};

const labelStyle = {
  fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--ht-body)'
};

/**
 * Create an account. One call: the backend takes username, role and password
 * together and hashes the password server-side.
 */
export function UserForm({ onClose, onCreated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(() => suggestPassword());
  const [role, setRole] = useState('staff');
  const [fields, setFields] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async () => {
    if (!username.trim()) return setFields({ username: 'Give the account a username.' });
    if (password.length < PASSWORD_MIN_LENGTH) {
      return setFields({ password: `Use at least ${PASSWORD_MIN_LENGTH} characters.` });
    }

    setBusy(true);
    setError(null);
    setFields({});
    try {
      await createUser({ username: username.trim(), role, password });
      onCreated(username.trim(), password);
    } catch (err) {
      setBusy(false);
      if (err.fields) setFields(err.fields);
      else setError(err.message || 'Could not create the account. Try again.');
    }
  };

  const styleFor = (key) => (fields[key] ? { ...fieldStyle, borderColor: 'var(--ht-plum)' } : fieldStyle);
  const fieldError = (key) => fields[key]
    ? <span role="alert" style={{ fontSize: 13, color: 'var(--ht-error-text)' }}>{fields[key]}</span>
    : null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(60,55,45,0.45)' }} />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', zIndex: 71, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)', maxWidth: 560, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto',
          background: 'var(--ht-field)', border: '1px solid var(--ht-clay)',
          borderRadius: 'var(--ht-radius-card)', padding: '24px 22px',
          animation: 'ht-dialog 0.25s ease both'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--ht-display)', fontSize: 21, fontWeight: 600 }}>Create a user</div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--ht-body-font)', fontSize: '13.5px', fontWeight: 600, color: 'var(--ht-olive)', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>

        <div className="ht-formgrid">
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={labelStyle}>Username</span>
            <input
              type="text" name="username" value={username}
              onChange={(e) => { setUsername(e.target.value.slice(0, 40)); setFields({}); }}
              autoComplete="off" placeholder="marisol" style={styleFor('username')}
            />
            {fieldError('username')}
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={labelStyle}>Password</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <input
                type="text" name="password" value={password}
                onChange={(e) => { setPassword(e.target.value); setFields({}); }}
                autoComplete="off" style={styleFor('password')}
              />
              <button type="button" className="ht-sec" onClick={() => setPassword(suggestPassword())}>New</button>
            </span>
            {fieldError('password')}
          </label>
        </div>

        <div style={{ marginTop: 18 }}>
          <span style={{ display: 'block', ...labelStyle, marginBottom: 10 }}>Role</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLES.map(r => {
              const on = role === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
                    textAlign: 'left', padding: '12px 16px', minHeight: 44, cursor: 'pointer',
                    borderRadius: 'var(--ht-radius-field)',
                    background: on ? '#F3EFE4' : 'none',
                    border: '1px solid ' + (on ? 'var(--ht-olive)' : 'var(--ht-hairline)')
                  }}
                >
                  <span style={{ fontFamily: 'var(--ht-body-font)', fontSize: 15, fontWeight: on ? 700 : 600, color: 'var(--ht-ink)' }}>
                    {r.label}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--ht-body)' }}>{r.note}</span>
                </button>
              );
            })}
          </div>
          {fieldError('role')}
        </div>

        {error ? <div style={{ marginTop: 16 }}><FormError>{error}</FormError></div> : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ht-hairline)' }}>
          <button type="button" className="ht-sec" onClick={onClose}>Discard</button>
          <button type="button" className="ht-pri" onClick={submit} disabled={busy}>
            {busy ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </div>
    </>
  );
}
