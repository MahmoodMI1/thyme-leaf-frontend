import { useEffect, useState } from 'react';
import { createFood, updateFood } from '../../api/foods-api.js';
import { FormError } from '../../components/FormField.jsx';
import { unitPriceLabel } from '../../lib/format.js';

const inputStyle = {
  width: '100%', minHeight: 52, padding: '14px 16px',
  fontFamily: 'var(--ht-body-font)', fontSize: '15.5px', color: 'var(--ht-ink)',
  background: 'var(--ht-field)', border: '1px solid var(--ht-hairline)',
  borderRadius: 'var(--ht-radius-field)', outline: 'none'
};

const labelStyle = {
  fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--ht-body)'
};

const MAX = { name: 60, unit: 12, qty: 10, price: 10 };

const blank = { name: '', qty: '', unit: '', price: '' };

/**
 * Add / edit a food. PATCH carries the full field set, same as POST.
 *
 * Field-level errors come from the server: a validation 400 carries
 * `fields` keyed by input name, so they land under the right input without
 * the client duplicating the backend's rules.
 */
export function FoodForm({ editing, units, onClose, onSaved }) {
  const [f, setF] = useState(blank);
  const [fields, setFields] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setF(editing
      ? { name: editing.name, qty: String(editing.qty), unit: editing.unit, price: String(editing.price) }
      : blank);
    setFields({});
    setError(null);
  }, [editing]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => {
    const v = e.target.value.slice(0, MAX[key] || 60);
    setF(prev => ({ ...prev, [key]: v }));
    setFields(prev => (prev[key] ? { ...prev, [key]: null } : prev));
    setError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});

    const body = {
      name: f.name.trim(),
      qty: parseFloat(f.qty),
      unit: f.unit.trim(),
      price: parseFloat(f.price)
    };

    try {
      await (editing ? updateFood(editing.id, body) : createFood(body));
      onSaved();
    } catch (err) {
      setBusy(false);
      if (err.fields) setFields(err.fields);
      setError(err.fields ? null : (err.message || 'Could not save. Try again.'));
    }
  };

  const qty = parseFloat(f.qty);
  const price = parseFloat(f.price);
  const preview = isFinite(qty) && isFinite(price) && qty > 0
    ? unitPriceLabel(price / qty, f.unit)
    : '—';

  const fieldError = (key) => fields[key]
    ? <span role="alert" style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ht-error-text)' }}>{fields[key]}</span>
    : null;

  const styleFor = (key) => (fields[key] ? { ...inputStyle, borderColor: 'var(--ht-plum)' } : inputStyle);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(60,55,45,0.45)' }} />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', zIndex: 71, top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 40px)', maxWidth: 620,
          maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
          border: '1px solid var(--ht-clay)', background: 'var(--ht-field)',
          borderRadius: 'var(--ht-radius-card)', padding: '24px 22px',
          animation: 'ht-dialog 0.25s ease both'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, marginBottom: 18 }}>
          <div style={{ fontFamily: 'var(--ht-display)', fontSize: 21, fontWeight: 600 }}>
            {editing ? 'Edit food' : 'Add a food'}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--ht-body-font)', fontSize: '13.5px', fontWeight: 600, color: 'var(--ht-olive)', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="ht-formgrid">
            <label className="ht-f-name" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>Name</span>
              <input type="text" name="name" value={f.name} onChange={set('name')} placeholder="Unsalted butter" style={styleFor('name')} />
              {fieldError('name')}
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>Quantity</span>
              <input type="text" name="qty" inputMode="decimal" value={f.qty} onChange={set('qty')} placeholder="5" style={styleFor('qty')} />
              {fieldError('qty')}
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>Unit</span>
              <input type="text" name="unit" list="ht-units" value={f.unit} onChange={set('unit')} autoComplete="off" placeholder="lb" style={styleFor('unit')} />
              <datalist id="ht-units">
                {units.map(u => <option key={u} value={u} />)}
              </datalist>
              {fieldError('unit')}
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>Price paid</span>
              <input type="text" name="price" inputMode="decimal" value={f.price} onChange={set('price')} placeholder="21.45" style={styleFor('price')} />
              {fieldError('price')}
            </label>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--ht-hairline)' }}>
            <div style={{ fontSize: 14, color: 'var(--ht-body)' }}>
              Unit price
              <strong style={{ fontFamily: 'var(--ht-display)', fontSize: 19, fontWeight: 600, color: 'var(--ht-ink)', marginLeft: 8 }}>
                {preview}
              </strong>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="ht-sec" onClick={onClose}>Discard</button>
              <button type="submit" className="ht-pri" disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Add food'}
              </button>
            </div>
          </div>

          {error ? <div style={{ marginTop: 16 }}><FormError>{error}</FormError></div> : null}
        </form>
      </div>
    </>
  );
}
