import { roleLabel } from '../api/users-api.js';

const TONE = {
  admin: { fg: '#833B44', bg: '#F7ECEC', bd: '#E0B9BD' },
  chef: { fg: '#5F6140', bg: '#E9EADA', bd: '#C6C8A8' },
  staff: { fg: 'var(--ht-body)', bg: '#F3EFE4', bd: 'var(--ht-clay)' }
};

export function RolePill({ role }) {
  const tone = TONE[role] || TONE.staff;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', borderRadius: 'var(--ht-radius-pill)',
        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
        color: tone.fg, background: tone.bg, border: '1px solid ' + tone.bd
      }}
    >
      {roleLabel(role)}
    </span>
  );
}
