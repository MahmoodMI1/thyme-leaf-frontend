import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deactivateUser, listUsers, PASSWORD_MIN_LENGTH, reactivateUser,
  ROLES, setPassword as apiSetPassword, updateUser
} from '../../api/users-api.js';
import { useSession } from '../../auth/useSession.js';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { LoadingPanel, RolePanel, UnreachablePanel } from '../../components/Panels.jsx';
import { UserForm } from './UserForm.jsx';

const headStyle = { fontSize: '10.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ht-olive)' };

const searchStyle = {
  flex: '1 1 240px', minWidth: 0, minHeight: 44, padding: '10px 15px',
  fontFamily: 'var(--ht-body-font)', fontSize: 15, color: 'var(--ht-ink)',
  background: 'var(--ht-field)', border: '1px solid var(--ht-hairline)',
  borderRadius: 'var(--ht-radius-field)', outline: 'none'
};

const fieldStyle = {
  width: '100%', minHeight: 48, padding: '12px 15px',
  fontFamily: 'var(--ht-body-font)', fontSize: 15, color: 'var(--ht-ink)',
  background: 'var(--ht-field)', border: '1px solid var(--ht-hairline)',
  borderRadius: 'var(--ht-radius-field)', outline: 'none'
};

export function UsersScreen() {
  const { user: me } = useSession();

  const [users, setUsers] = useState([]);
  const [state, setState] = useState('loading');
  const [denied, setDenied] = useState(false);

  const [query, setQuery] = useState('');
  const [showDeactivated, setShowDeactivated] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [resetFor, setResetFor] = useState(null);
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [resetError, setResetError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [rowError, setRowError] = useState(null);

  const load = useCallback(() => {
    setState('loading');
    listUsers()
      .then(rows => { setUsers(rows); setState('ready'); })
      .catch(err => {
        if (err.status === 403) { setDenied(true); setState('ready'); }
        else setState('failed');
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const deactivatedCount = useMemo(
    () => users.filter(u => u.status !== 'active').length,
    [users]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      if (!showDeactivated && u.status !== 'active') return false;
      if (q && !u.username.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, query, showDeactivated]);

  // Every write is followed by a refetch — the server owns the record.
  const run = async (fn) => {
    setRowError(null);
    try {
      await fn();
    } catch (err) {
      setRowError(err.message || 'That change didn’t save. Try again.');
    }
    load();
  };

  const submitReset = async () => {
    if (pass1.length < PASSWORD_MIN_LENGTH) {
      return setResetError(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
    }
    if (pass1 !== pass2) return setResetError('Those two don’t match.');

    try {
      await apiSetPassword(resetFor.id, pass1);
      setNotice({
        kicker: 'Password set',
        title: `${resetFor.username} has a new password`,
        pass: pass1,
        body: 'Read it out to them. Any session they had open is now signed out.'
      });
      setResetFor(null);
      setPass1('');
      setPass2('');
      load();
    } catch (err) {
      setResetError(err.fields?.password || err.message || 'That didn’t save. Try again.');
    }
  };

  if (denied) return <RolePanel variant="users" roles={['admin']} />;
  if (state === 'failed') return <UnreachablePanel title="The staff accounts didn’t load" onRetry={load} />;

  return (
    <div className="ht-users">
      <div style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 10 }}>
        Access
      </div>
      <h1 style={{ fontFamily: 'var(--ht-display)', fontSize: 30, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.25, textWrap: 'balance' }}>
        Staff accounts
      </h1>
      <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 22px', maxWidth: '62ch', textWrap: 'pretty' }}>
        You create every account and issue every password. Deactivating keeps the person’s history but locks them out — nothing is deleted.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 40))}
          placeholder="Search a username"
          style={searchStyle}
        />
        <span style={{ fontSize: 13, color: 'var(--ht-body)', whiteSpace: 'nowrap' }}>
          {visible.length === users.length
            ? `${users.length} ${users.length === 1 ? 'account' : 'accounts'}`
            : `${visible.length} of ${users.length} accounts`}
        </span>
        <button type="button" className="ht-pri" onClick={() => setCreateOpen(true)}>+ Create user</button>
      </div>

      {deactivatedCount ? (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="ht-sec"
            onClick={() => setShowDeactivated(v => !v)}
            aria-pressed={showDeactivated}
          >
            {showDeactivated ? 'Hide deactivated' : `Show deactivated (${deactivatedCount})`}
          </button>
        </div>
      ) : null}

      {rowError ? (
        <div role="alert" style={{ border: '1px solid var(--ht-error-border)', background: 'var(--ht-error-bg)', borderRadius: 'var(--ht-radius-field)', padding: '12px 15px', marginBottom: 16, fontSize: 14, color: 'var(--ht-error-text)' }}>
          {rowError}
        </div>
      ) : null}

      <div className="ht-row ht-thead" style={{ padding: '0 18px 10px', borderBottom: '1px solid var(--ht-clay)' }}>
        <div style={headStyle}>User</div>
        <div className="ht-cells">
          <div style={headStyle}>Role</div>
          <div style={headStyle}>Status</div>
          <div style={headStyle}>Created</div>
        </div>
        <div />
      </div>

      {state === 'loading' ? <LoadingPanel label="Loading staff accounts…" /> : null}

      {state === 'ready' && visible.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {visible.map(u => {
            const isYou = u.username === me.username;
            const active = u.status === 'active';
            return (
              <div
                key={u.id}
                className="ht-row"
                style={{
                  border: '1px solid var(--ht-hairline)', background: 'var(--ht-field)',
                  borderRadius: 14, padding: '12px 18px', opacity: active ? 1 : 0.72
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--ht-display)', fontSize: 18, fontWeight: 600 }}>{u.username}</span>
                  {isYou ? (
                    <span
                      title="You can’t change your own role or lock yourself out"
                      style={{ fontSize: '9.5px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ht-olive)', border: '1px solid var(--ht-clay)', borderRadius: 'var(--ht-radius-pill)', padding: '3px 8px' }}
                    >
                      You
                    </span>
                  ) : null}
                </div>

                <div className="ht-cells">
                  <div>
                    <span className="ht-lab">Role</span>
                    <select
                      value={u.role}
                      onChange={(e) => run(() => updateUser(u.id, { role: e.target.value }))}
                      disabled={isYou}
                      aria-label={`Role for ${u.username}`}
                      style={{
                        width: '100%', maxWidth: 160, minHeight: 36, padding: '6px 8px',
                        fontFamily: 'var(--ht-body-font)', fontSize: 14,
                        color: isYou ? 'var(--ht-muted)' : 'var(--ht-ink)',
                        background: 'var(--ht-field)', border: '1px solid var(--ht-hairline)',
                        borderRadius: 'var(--ht-radius-sec)', cursor: isYou ? 'default' : 'pointer'
                      }}
                    >
                      {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="ht-lab">Status</span>
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: active ? '#5F6140' : 'var(--ht-plum)' }}>
                      {active ? 'Active' : 'Deactivated'}
                    </span>
                  </div>
                  <div>
                    <span className="ht-lab">Created</span>
                    <span style={{ fontSize: 14, color: 'var(--ht-body)' }}>{u.created || '—'}</span>
                  </div>
                </div>

                <div className="ht-acts">
                  <button
                    type="button"
                    className="ht-sec ht-sec--muted"
                    onClick={() => { setResetFor(u); setPass1(''); setPass2(''); setResetError(null); }}
                  >
                    Set password
                  </button>
                  <button
                    type="button"
                    className="ht-sec ht-sec--muted"
                    disabled={isYou}
                    title={isYou ? 'You can’t deactivate your own account' : undefined}
                    onClick={() => {
                      if (isYou) return;
                      if (active) setPending(u);
                      else run(() => reactivateUser(u.id));
                    }}
                  >
                    {active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {state === 'ready' && !visible.length ? (
        <div style={{ marginTop: 10 }}>
          <EmptyState
            title={users.length ? 'No one matches' : 'No accounts yet'}
            body={users.length ? 'Try another username.' : 'Create the first account and it lands here.'}
          />
        </div>
      ) : null}

      {createOpen ? (
        <UserForm
          onClose={() => setCreateOpen(false)}
          onCreated={(username, password) => {
            setCreateOpen(false);
            setNotice({
              kicker: 'Account created',
              title: `${username} can sign in now`,
              pass: password,
              body: 'Read the password out to them. They’ll use it with their username to sign in.'
            });
            load();
          }}
        />
      ) : null}

      {pending ? (
        <ConfirmDialog
          kicker="Lock out"
          title={`Deactivate ${pending.username}?`}
          body="They can’t sign in until you reactivate them. Their dishes and history stay exactly as they are."
          confirmLabel="Deactivate"
          cancelLabel="Keep active"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const u = pending;
            setPending(null);
            run(() => deactivateUser(u.id));
          }}
        />
      ) : null}

      {resetFor ? (
        <>
          <div onClick={() => setResetFor(null)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(60,55,45,0.45)' }} />
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed', zIndex: 71, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 40px)', maxWidth: 440,
              background: 'var(--ht-field)', border: '1px solid var(--ht-clay)',
              borderRadius: 'var(--ht-radius-card)', padding: '26px 24px',
              animation: 'ht-dialog 0.25s ease both'
            }}
          >
            <div className="ht-orn" style={{ marginBottom: 12 }}>Set a password</div>
            <div style={{ fontFamily: 'var(--ht-display)', fontSize: 22, fontWeight: 600, lineHeight: 1.3, marginBottom: 8, textWrap: 'balance' }}>
              Set a password for {resetFor.username}
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 18px', textWrap: 'pretty' }}>
              Type it twice so there’s no doubt what you read out to them.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ht-body)' }}>
                  New password
                </span>
                <input type="text" value={pass1} onChange={(e) => { setPass1(e.target.value); setResetError(null); }} autoComplete="off" placeholder="thyme-4821" style={fieldStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ht-body)' }}>
                  Type it again
                </span>
                <input type="text" value={pass2} onChange={(e) => { setPass2(e.target.value); setResetError(null); }} autoComplete="off" placeholder="thyme-4821" style={fieldStyle} />
              </label>
              {resetError ? <span role="alert" style={{ fontSize: 13, color: 'var(--ht-plum)' }}>{resetError}</span> : null}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ht-hairline)' }}>
              <button type="button" className="ht-sec" onClick={() => setResetFor(null)}>Cancel</button>
              <button type="button" className="ht-pri" onClick={submitReset}>Set password</button>
            </div>
          </div>
        </>
      ) : null}

      {notice ? (
        <>
          <div onClick={() => setNotice(null)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(60,55,45,0.45)' }} />
          <div
            role="alertdialog"
            aria-modal="true"
            style={{
              position: 'fixed', zIndex: 71, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 40px)', maxWidth: 420,
              background: 'var(--ht-bg)', border: '1px solid var(--ht-clay)',
              borderRadius: 'var(--ht-radius-card)', padding: '26px 24px',
              animation: 'ht-dialog 0.25s ease both'
            }}
          >
            <div className="ht-orn" style={{ marginBottom: 12 }}>{notice.kicker}</div>
            <div style={{ fontFamily: 'var(--ht-display)', fontSize: 22, fontWeight: 600, lineHeight: 1.3, marginBottom: 12, textWrap: 'balance' }}>
              {notice.title}
            </div>
            {notice.pass ? (
              <div style={{ border: '1px solid var(--ht-clay)', background: 'var(--ht-field)', borderRadius: 'var(--ht-radius-field)', padding: '14px 16px', marginBottom: 14, textAlign: 'center', fontFamily: 'var(--ht-body-font)', fontSize: 22, fontWeight: 700, letterSpacing: '0.04em' }}>
                {notice.pass}
              </div>
            ) : null}
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 20px', textWrap: 'pretty' }}>
              {notice.body}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="ht-pri" onClick={() => setNotice(null)}>Done</button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
