import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createDish, getDish, TYPES, updateDish } from '../../api/dishes-api.js';
import { listFoods } from '../../api/foods-api.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { FormError } from '../../components/FormField.jsx';
import { LoadingPanel, UnreachablePanel } from '../../components/Panels.jsx';
import { money, unitPriceLabel, unitPriceOf } from '../../lib/format.js';
import { LIMITS } from '../../lib/ui-state.js';

const RESULT_CAP = 8;
const LINES_PER_PAGE = 6;

const inputStyle = {
  width: '100%', minHeight: 52, padding: '14px 16px',
  fontFamily: 'var(--ht-body-font)', fontSize: '15.5px', color: 'var(--ht-ink)',
  background: 'var(--ht-field)', border: '1px solid var(--ht-hairline)',
  borderRadius: 'var(--ht-radius-field)', outline: 'none'
};

const labelStyle = {
  display: 'block', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--ht-body)'
};

const chipStyle = (on) => ({
  padding: '0 14px', minHeight: 40, borderRadius: 'var(--ht-radius-pill)',
  fontFamily: 'var(--ht-body-font)', fontSize: 13.5, fontWeight: on ? 700 : 500,
  background: on ? 'var(--ht-ink)' : 'none',
  color: on ? 'var(--ht-bg)' : 'var(--ht-body)',
  border: '1px solid ' + (on ? 'var(--ht-ink)' : 'var(--ht-hairline)'),
  cursor: 'pointer'
});

export function BuilderScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const editId = parseInt(params.get('edit'), 10);
  const isEdit = isFinite(editId);

  const [foods, setFoods] = useState([]);
  const [state, setState] = useState('loading');

  const [dishName, setDishName] = useState('');
  const [type, setType] = useState(null);
  const [photo, setPhoto] = useState('');
  const [credit, setCredit] = useState('');
  const [creditHref, setCreditHref] = useState('');
  const [lines, setLines] = useState([]);

  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [reveal, setReveal] = useState(0);
  const [linePage, setLinePage] = useState(0);

  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState(null);
  const [fields, setFields] = useState({});
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);

  const searchRef = useRef(null);
  const wrapRef = useRef(null);

  const load = useCallback(() => {
    setState('loading');
    listFoods()
      .then(async (list) => {
        setFoods(list);
        if (!isEdit) return;
        // Detail route: a 404 means the dish is gone, and there's no list here
        // to refresh — go back to the menu instead of stranding the user.
        const dish = await getDish(editId);
        setDishName(dish.name);
        setType(dish.type);
        setPhoto(dish.photo || '');
        setCredit(dish.credit || '');
        setCreditHref(dish.creditHref || '');
        setLines((dish.ingredients || []).map(ing => ({
          foodId: ing.foodId,
          name: ing.name,
          unit: ing.unit,
          amount: String(ing.amount)
        })));
      })
      .then(() => setState('ready'))
      .catch(err => {
        if (isEdit && err.status === 404) navigate('/menu', { replace: true });
        else setState('failed');
      });
  }, [editId, isEdit, navigate]);

  useEffect(() => { load(); }, [load]);

  // Clicking anywhere that isn't the picker or an input closes the picker.
  useEffect(() => {
    if (!pickerOpen) return undefined;
    const away = (e) => {
      if (wrapRef.current && wrapRef.current.contains(e.target)) return;
      setPickerOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [pickerOpen]);

  const foodById = useMemo(() => {
    const m = new Map();
    foods.forEach(f => m.set(f.id, f));
    return m;
  }, [foods]);

  const chosen = useMemo(() => new Set(lines.map(l => l.foodId)), [lines]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return foods.filter(f => !chosen.has(f.id) && (!q || f.name.toLowerCase().includes(q)));
  }, [foods, chosen, query]);

  const shown = matches.slice(0, RESULT_CAP + reveal);

  const addFood = (food) => {
    setLines(prev => prev.concat([{ foodId: food.id, name: food.name, unit: food.unit, amount: '' }]));
    setQuery('');
    setHi(0);
    setReveal(0);
    setPickerOpen(false);
    setError(null);
    setSaved(null);
    // Straight back to the search box so a run of ingredients stays on-keyboard.
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  const searchKeys = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(shown.length - 1, h + 1)); setPickerOpen(true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[hi]) addFood(shown[hi]); }
    else if (e.key === 'Escape') setPickerOpen(false);
  };

  // Live preview only — the server recomputes every cost on save.
  const lineCost = (l) => {
    const up = unitPriceOf(foodById.get(l.foodId));
    const a = parseFloat(l.amount);
    return up != null && isFinite(a) ? up * a : null;
  };

  const total = lines.reduce((sum, l) => sum + (lineCost(l) || 0), 0);

  const linePageCount = Math.max(1, Math.ceil(lines.length / LINES_PER_PAGE));
  const lp = Math.min(linePage, linePageCount - 1);
  const pageLines = lines
    .map((l, i) => ({ l, i }))
    .slice(lp * LINES_PER_PAGE, lp * LINES_PER_PAGE + LINES_PER_PAGE);

  const submit = async () => {
    const nameMissing = !dishName.trim();
    const amountMissing = lines.some(l => {
      const a = parseFloat(l.amount);
      return !(a > 0 && a <= LIMITS.amount.max);
    });

    if (nameMissing || amountMissing || lines.length === 0 || !type) {
      setAttempted(true);
      setError(lines.length === 0 ? 'Add at least one ingredient.' : null);
      return;
    }

    setBusy(true);
    setError(null);
    setFields({});

    // Costs, names and units are the server's to resolve — send only what it
    // can't derive.
    const body = {
      name: dishName.trim(),
      type,
      photo: photo.trim() || null,
      credit: credit.trim() || null,
      creditHref: creditHref.trim() || null,
      ingredients: lines.map(l => ({ foodId: l.foodId, amount: parseFloat(l.amount) }))
    };

    try {
      if (isEdit) {
        await updateDish(editId, body);
        navigate('/menu');
        return;
      }
      await createDish(body);
      setSaved(`${body.name} saved — ${money(total)} for ${lines.length} ${lines.length === 1 ? 'ingredient.' : 'ingredients.'}`);
      setDishName(''); setType(null); setPhoto(''); setCredit(''); setCreditHref('');
      setLines([]); setQuery(''); setHi(0); setReveal(0); setLinePage(0); setAttempted(false);
      setBusy(false);
    } catch (err) {
      setBusy(false);
      if (err.fields) setFields(err.fields);
      setError(err.fields ? null : (err.message || 'Couldn’t save the change. Try again.'));
    }
  };

  if (state === 'loading') return <LoadingPanel label="Loading the master foods list…" />;
  if (state === 'failed') return <UnreachablePanel title="The master foods list didn’t load" onRetry={load} />;

  const nameBad = attempted && !dishName.trim();
  const typeBad = attempted && !type;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 10 }}>
        {isEdit ? 'Editing a dish' : 'Costing'}
      </div>
      <h1 style={{ fontFamily: 'var(--ht-display)', fontSize: 30, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.25, textWrap: 'balance' }}>
        {isEdit ? 'Edit dish' : 'Dish builder'}
      </h1>
      <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 22px', maxWidth: '62ch', textWrap: 'pretty' }}>
        Pull ingredients from the master list and set how much of each goes into one plate. The cost adds itself up.
      </p>

      {saved ? (
        <div
          role="status"
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between',
            border: '1px solid #C6CBA6', background: '#F1F3E4', borderRadius: 'var(--ht-radius-card)',
            padding: '16px 18px', marginBottom: 24
          }}
        >
          <span style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#4F5233' }}>{saved}</span>
          <span style={{ fontSize: '12.5px', color: 'var(--ht-body)' }}>Fresh dish ready below</span>
        </div>
      ) : null}

      <div className="ht-hero" style={{ border: '1px solid var(--ht-hairline)', background: 'var(--ht-field)', borderRadius: 'var(--ht-radius-card)', overflow: 'hidden', marginBottom: 22 }}>
        <div style={{ flex: 1, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 18, minWidth: 0 }}>
          <div>
            <div style={{ fontSize: '10.5px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 8 }}>
              Card photo
            </div>
            <div style={{ fontFamily: 'var(--ht-display)', fontSize: 27, fontWeight: 600, lineHeight: 1.25, textWrap: 'balance' }}>
              {dishName.trim() || 'Untitled dish'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ht-body)', marginTop: 6 }}>
              {lines.length === 1 ? '1 ingredient' : `${lines.length} ingredients`} · {money(total)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>Photo URL</span>
              <input
                type="url" name="photo" value={photo}
                onChange={(e) => { setPhoto(e.target.value); setSaved(null); }}
                placeholder="https://…"
                style={fields.photo ? { ...inputStyle, borderColor: 'var(--ht-plum)' } : inputStyle}
              />
              {fields.photo ? <span role="alert" style={{ fontSize: 13, color: 'var(--ht-error-text)' }}>{fields.photo}</span> : null}
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 160px' }}>
                <span style={labelStyle}>Credit</span>
                <input type="text" name="credit" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="Wikimedia Commons" style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 160px' }}>
                <span style={labelStyle}>Credit link</span>
                <input type="url" name="creditHref" value={creditHref} onChange={(e) => setCreditHref(e.target.value)} placeholder="https://…" style={inputStyle} />
              </label>
            </div>
          </div>
        </div>

        <div
          className="ht-heroimg"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#EFE9DC',
            ...(photo.trim() ? { backgroundImage: `url("${photo.trim()}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : null)
          }}
        >
          {!photo.trim() ? (
            <span style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ht-muted)' }}>
              4:3 card photo
            </span>
          ) : null}
        </div>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 26 }}>
        <span style={labelStyle}>Dish name</span>
        <input
          type="text" name="name" value={dishName}
          onChange={(e) => { setDishName(e.target.value.slice(0, 60)); setError(null); setSaved(null); }}
          placeholder="Roasted heirloom tart"
          style={(nameBad || fields.name) ? { ...inputStyle, borderColor: 'var(--ht-plum)' } : inputStyle}
        />
        {fields.name ? <span role="alert" style={{ fontSize: 13, color: 'var(--ht-error-text)' }}>{fields.name}</span>
          : nameBad ? <span style={{ fontSize: 13, color: 'var(--ht-plum)' }}>Needs a name before it can be saved.</span>
            : null}
      </label>

      <div style={{ marginBottom: 24 }}>
        <span style={{ ...labelStyle, marginBottom: 10 }}>Course</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TYPES.map(t => (
            <button key={t.key} type="button" onClick={() => { setType(t.key); setSaved(null); }} style={chipStyle(type === t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        {typeBad ? (
          <span style={{ display: 'block', fontSize: 13, color: 'var(--ht-plum)', marginTop: 8 }}>
            Pick a course so it files under the right part of the menu.
          </span>
        ) : null}
        {fields.type ? <span role="alert" style={{ display: 'block', fontSize: 13, color: 'var(--ht-error-text)', marginTop: 8 }}>{fields.type}</span> : null}
      </div>

      <div ref={wrapRef} style={{ position: 'relative', marginBottom: 22 }}>
        <span style={{ ...labelStyle, marginBottom: 8 }}>Add an ingredient</span>
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPickerOpen(true); setHi(0); setReveal(0); }}
          onFocus={() => setPickerOpen(true)}
          onKeyDown={searchKeys}
          autoComplete="off"
          placeholder="Search the master foods list — ↑↓ to move, Enter to add"
          style={inputStyle}
        />

        {pickerOpen ? (
          <div
            style={{
              position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 6, zIndex: 30,
              background: 'var(--ht-field)', border: '1px solid var(--ht-clay)',
              borderRadius: 14, padding: 6, maxHeight: 320, overflowY: 'auto',
              boxShadow: '0 10px 24px rgba(60,55,45,0.10)'
            }}
          >
            {shown.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => addFood(f)}
                onMouseEnter={() => setHi(i)}
                style={{
                  display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, padding: '11px 12px', minHeight: 44, textAlign: 'left',
                  fontFamily: 'var(--ht-body-font)', cursor: 'pointer',
                  background: i === hi ? '#F3EFE4' : 'none', border: 'none', borderRadius: 10
                }}
              >
                <span style={{ fontSize: 15, color: 'var(--ht-ink)', minWidth: 0 }}>{f.name}</span>
                <span style={{ fontSize: '13.5px', color: 'var(--ht-olive)', whiteSpace: 'nowrap' }}>
                  {unitPriceLabel(unitPriceOf(f), f.unit)}
                </span>
              </button>
            ))}

            {!shown.length ? (
              <div style={{ padding: '16px 12px', fontSize: 14, color: 'var(--ht-body)' }}>
                No food matches — check the <Link to="/foods">master list</Link>.
              </div>
            ) : null}

            {matches.length > shown.length ? (
              <div style={{ position: 'sticky', bottom: -6, background: 'var(--ht-field)', borderTop: '1px solid var(--ht-hairline)', padding: '10px 12px 12px', margin: '0 -6px -6px' }}>
                <button
                  type="button"
                  onClick={() => setReveal(r => r + RESULT_CAP)}
                  style={{
                    display: 'block', width: '100%', background: 'none',
                    border: '1px solid var(--ht-clay)', borderRadius: 'var(--ht-radius-pill)',
                    minHeight: 44, fontFamily: 'var(--ht-body-font)', fontSize: '13.5px',
                    fontWeight: 600, color: 'var(--ht-olive)', cursor: 'pointer'
                  }}
                >
                  Show {Math.min(RESULT_CAP, matches.length - shown.length)} more of {matches.length}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {linePageCount > 1 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: '12.5px', color: 'var(--ht-body)', marginRight: 4 }}>
            {lines.length} ingredients
          </span>
          {Array.from({ length: linePageCount }, (_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLinePage(n)}
              style={{
                minWidth: 30, height: 30, padding: '0 8px', lineHeight: 1, cursor: 'pointer',
                fontFamily: 'var(--ht-body-font)', fontSize: 13, fontWeight: n === lp ? 700 : 500,
                background: n === lp ? 'var(--ht-ink)' : 'none',
                color: n === lp ? 'var(--ht-bg)' : 'var(--ht-body)',
                border: '1px solid ' + (n === lp ? 'var(--ht-ink)' : 'var(--ht-hairline)'),
                borderRadius: 'var(--ht-radius-pill)'
              }}
            >
              {n + 1}
            </button>
          ))}
        </div>
      ) : null}

      {lines.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pageLines.map(({ l, i }) => {
            const cost = lineCost(l);
            const bad = attempted && !(parseFloat(l.amount) > 0);
            return (
              <div key={l.foodId} className="ht-line" style={{ border: '1px solid var(--ht-hairline)', background: 'var(--ht-field)', borderRadius: 'var(--ht-radius-card)', padding: '16px 18px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--ht-display)', fontSize: 18, fontWeight: 600, lineHeight: 1.35 }}>{l.name}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ht-olive)', marginTop: 3 }}>
                    {unitPriceLabel(unitPriceOf(foodById.get(l.foodId)), l.unit)}
                  </div>
                  {bad ? <div style={{ fontSize: '12.5px', color: 'var(--ht-plum)', marginTop: 4 }}>Needs an amount</div> : null}
                </div>

                <div className="ht-lineinputs">
                  <span style={{ position: 'relative', display: 'block' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={l.amount}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 10);
                        setLines(prev => prev.map((x, n) => (n === i ? { ...x, amount: v } : x)));
                        setError(null);
                        setSaved(null);
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchRef.current?.focus(); } }}
                      aria-label={`Amount of ${l.name}`}
                      placeholder="0"
                      style={{ ...inputStyle, minHeight: 48, paddingRight: 52, ...(bad ? { borderColor: 'var(--ht-plum)' } : null) }}
                    />
                    <span aria-hidden="true" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 600, color: 'var(--ht-body)', pointerEvents: 'none' }}>
                      {l.unit}
                    </span>
                  </span>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ht-plum)', whiteSpace: 'nowrap' }}>
                    {cost == null ? '—' : money(cost)}
                  </div>
                </div>

                <button
                  type="button"
                  className="ht-sec"
                  onClick={() => { setLines(prev => prev.filter((_, n) => n !== i)); setError(null); setSaved(null); }}
                  style={{ borderWidth: 1, borderColor: 'var(--ht-hairline)', color: 'var(--ht-body)', fontWeight: 600, justifySelf: 'end' }}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No ingredients yet" body="Search above to pull the first one in." />
      )}

      {error ? <div style={{ marginTop: 20 }}><FormError>{error}</FormError></div> : null}
      {fields.ingredients ? <div style={{ marginTop: 20 }}><FormError>{fields.ingredients}</FormError></div> : null}

      <div className="ht-total" style={{ justifyContent: 'space-between', marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--ht-clay)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="ht-orn">Dish cost</span>
          <span style={{ fontFamily: 'var(--ht-display)', fontSize: 22, fontWeight: 600 }}>{money(total)}</span>
          <span style={{ fontSize: '12.5px', color: 'var(--ht-body)' }}>
            {lines.length === 1 ? 'from 1 ingredient' : `from ${lines.length} ingredients`}
          </span>
        </div>
        <button type="button" className="ht-pri" onClick={submit} disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Save dish'}
        </button>
      </div>

      <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ht-muted)', margin: '14px 0 0' }}>
        Amounts are per plate. The cost shown here is a preview — the kitchen’s saved figure is recalculated from live prices every time the menu is opened.
      </p>
    </div>
  );
}
