import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listDishes, TYPES, typeLabel } from '../../api/dishes-api.js';
import { useSession } from '../../auth/useSession.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { LoadingPanel, UnreachablePanel } from '../../components/Panels.jsx';
import { money, num } from '../../lib/format.js';
import { loadUi, saveUi } from '../../lib/ui-state.js';

const PER_PAGE = 6;
const ING_PER_PAGE = 8;

// Course-tinted fallback panel — a designed placeholder, not a fake photo.
const TINTS = {
  canapes: ['#EFE9DC', '#B7A97E'],
  entrees: ['#E9EADA', '#77794F'],
  mains: ['#E4E3D2', '#5F6140'],
  sides: ['#F0EBDD', '#8C8474'],
  sweets: ['#F3E7E6', '#9F4A54'],
  tea: ['#E7EBE3', '#6E7A5E'],
  components: ['#EDE8DE', '#6E6759']
};

/**
 * Costs come from the server, per line, already resolved against current food
 * prices. Nothing is computed from the foods list here — the menu never fetches
 * it, which is also why kitchen staff (403 on foods) can open this screen.
 *
 * `lineCost` is absent or null when a line can't be priced. The dish's own
 * `cost` field is a sort key and is never displayed.
 */
function costOf(dish) {
  let total = 0;
  let missing = 0;
  (dish.ingredients || []).forEach(ing => {
    if (ing.lineCost == null) missing += 1;
    else total += Number(ing.lineCost);
  });
  return { total, missing };
}

const monogram = (dish) => {
  const w = String(dish?.name || '?').trim().split(/\s+/);
  return (w[0][0] + (w[1] ? w[1][0] : '')).toUpperCase();
};

const photoStyle = (dish) => {
  const base = { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, overflow: 'hidden' };
  if (dish?.photo) {
    return { ...base, backgroundImage: `url("${dish.photo}")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'var(--ht-ink)' };
  }
  const [bg, ink] = TINTS[dish?.type] || ['#F3EFE4', '#8C8474'];
  return { ...base, backgroundColor: bg, backgroundImage: `repeating-linear-gradient(135deg, ${ink}14 0 2px, transparent 2px 12px)` };
};

const chipStyle = (on) => ({
  padding: '0 14px', minHeight: 36, borderRadius: 'var(--ht-radius-pill)',
  fontFamily: 'var(--ht-body-font)', fontSize: '13px', fontWeight: on ? 700 : 500,
  background: on ? 'var(--ht-ink)' : 'none',
  color: on ? 'var(--ht-bg)' : 'var(--ht-body)',
  border: '1px solid ' + (on ? 'var(--ht-ink)' : 'var(--ht-hairline)'),
  cursor: 'pointer'
});

const pageBtnStyle = (on, disabled) => ({
  minWidth: 30, height: 30, padding: '0 8px', lineHeight: 1,
  cursor: disabled ? 'default' : 'pointer',
  fontFamily: 'var(--ht-body-font)', fontSize: 13, fontWeight: on ? 700 : 500,
  background: on ? 'var(--ht-ink)' : 'none',
  color: disabled ? '#C3BBA8' : (on ? 'var(--ht-bg)' : 'var(--ht-body)'),
  border: '1px solid ' + (on ? 'var(--ht-ink)' : 'var(--ht-hairline)'),
  borderRadius: 'var(--ht-radius-pill)'
});

// Google-style window: at most `size` numbers, centred on the current page.
function pageWindow(count, current, size) {
  if (count <= size) return Array.from({ length: count }, (_, i) => i);
  const start = Math.min(Math.max(0, current - Math.floor(size / 2)), count - size);
  return Array.from({ length: size }, (_, i) => start + i);
}

const stepStyle = {
  width: 34, height: 34, borderRadius: 'var(--ht-radius-pill)', cursor: 'pointer',
  fontFamily: 'var(--ht-body-font)', fontSize: 18, fontWeight: 700, lineHeight: 1,
  background: 'var(--ht-field)', border: '1px solid var(--ht-clay)', color: 'var(--ht-ink)'
};

export function MenuScreen() {
  const { user } = useSession();
  const showMoney = user.role !== 'staff';

  const [dishes, setDishes] = useState([]);
  const [state, setState] = useState('loading');

  const saved = useMemo(() => loadUi('menu') || {}, []);
  const [query, setQuery] = useState(saved.query || '');
  const [course, setCourse] = useState(saved.course || 'all');
  const [filter, setFilter] = useState(saved.filter || 'all');
  const [sort, setSort] = useState(saved.sort || 'name');
  const [mpage, setMpage] = useState(0);

  const [openId, setOpenId] = useState(null);
  const [batch, setBatch] = useState(1);
  const [batchInput, setBatchInput] = useState('1');
  const [checked, setChecked] = useState({});
  const [ipage, setIpage] = useState(0);

  const load = useCallback(() => {
    setState('loading');
    listDishes()
      .then(rows => { setDishes(rows); setState('ready'); })
      .catch(() => setState('failed'));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { saveUi('menu', { query, course, filter, sort }); }, [query, course, filter, sort]);

  const open = dishes.find(d => d.id === openId) || null;

  const counts = useMemo(() => {
    const c = {};
    dishes.forEach(d => { c[d.type] = (c[d.type] || 0) + 1; });
    return c;
  }, [dishes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = dishes
      .map(d => ({ d, c: costOf(d) }))
      .filter(({ d, c }) => {
        if (q && !(d.name.toLowerCase().includes(q) || (d.ingredients || []).some(i => String(i.name || '').toLowerCase().includes(q)))) return false;
        if (course !== 'all' && d.type !== course) return false;
        // Both extra filters are money- or photo-shaped and chef-only.
        if (showMoney && filter === 'missing' && !c.missing) return false;
        if (showMoney && filter === 'photo' && !d.photo) return false;
        return true;
      });

    // Sorting by cost is money, so staff always gets alphabetical.
    const key = showMoney ? sort : 'name';
    return rows.slice().sort((a, b) =>
      key === 'low' ? a.c.total - b.c.total
        : key === 'high' ? b.c.total - a.c.total
          : a.d.name.localeCompare(b.d.name)
    );
  }, [dishes, query, course, filter, sort, showMoney]);

  const mPageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const currentPage = Math.min(mpage, mPageCount - 1);
  const pageDishes = visible.slice(currentPage * PER_PAGE, currentPage * PER_PAGE + PER_PAGE);

  const openDish = (id) => {
    setOpenId(id);
    setBatch(1);
    setBatchInput('1');
    setChecked({});
    setIpage(0);
  };

  if (state === 'loading') return <LoadingPanel label="Loading dishes…" />;
  if (state === 'failed') return <UnreachablePanel title="The menu didn’t load" onRetry={load} />;

  /* ── Detail ─────────────────────────────────────────────────────────── */

  if (open) {
    const detail = costOf(open);
    const allLines = open.ingredients || [];
    const ingPageCount = Math.max(1, Math.ceil(allLines.length / ING_PER_PAGE));
    const ip = Math.min(ipage, ingPageCount - 1);
    const lines = allLines
      .map((ing, i) => ({ ing, i }))
      .slice(ip * ING_PER_PAGE, ip * ING_PER_PAGE + ING_PER_PAGE);

    const [, tintInk] = TINTS[open.type] || ['', '#8C8474'];

    return (
      <div className="ht-detailwrap" style={{ animation: 'ht-rise 0.35s ease both', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, width: '100%', maxWidth: 720, margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => { setOpenId(null); setChecked({}); setBatch(1); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'none',
            border: '1px solid var(--ht-hairline)', borderRadius: 'var(--ht-radius-pill)',
            padding: '0 16px', minHeight: 44, cursor: 'pointer',
            fontFamily: 'var(--ht-body-font)', fontSize: '13.5px', fontWeight: 600,
            color: 'var(--ht-olive)', whiteSpace: 'nowrap'
          }}
        >
          ← All dishes
        </button>

        <div className="ht-sheet">
          <div className="ht-sheetin">
            <div className="ht-cardphoto" style={photoStyle(open)} role="img" aria-label={open.name}>
              {!open.photo ? (
                <span style={{ fontFamily: 'var(--ht-display)', fontSize: 44, fontWeight: 600, color: tintInk, opacity: 0.75 }}>
                  {monogram(open)}
                </span>
              ) : null}
            </div>

            {open.credit ? (
              <div style={{ textAlign: 'center', margin: '12px 0 16px', fontSize: 11, color: 'var(--ht-muted)' }}>
                Photo:{' '}
                <a href={open.creditHref || undefined} target="_blank" rel="noopener" style={{ color: 'var(--ht-muted)', textDecoration: 'underline' }}>
                  {open.credit}
                </a>
              </div>
            ) : <div style={{ height: 16 }} />}

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10.5px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 10 }}>
                {typeLabel(open.type)}
              </div>
              <h1 style={{ fontFamily: 'var(--ht-display)', fontSize: 28, fontWeight: 600, margin: '0 0 10px', lineHeight: 1.3, textWrap: 'balance' }}>
                {open.name}
              </h1>
              <div className="ht-rule" style={{ margin: '0 auto 18px', maxWidth: 220 }}><span className="ht-diamond" /></div>
              <div style={{ fontSize: '13.5px', color: 'var(--ht-body)', marginBottom: 22 }}>
                {allLines.length} ingredients · costed from the master list
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, background: '#F3EFE4', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: '10.5px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 4 }}>
                    Cooking for
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ht-body)' }}>
                    {batch === 1
                      ? 'one plate of this dish'
                      : `${batch} plates — amounts${showMoney ? ' and cost' : ''} below are for all of them`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" onClick={() => { const n = Math.max(1, batch - 1); setBatch(n); setBatchInput(String(n)); }} aria-label="Fewer plates" style={stepStyle}>−</button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={batchInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                      const n = parseInt(raw, 10);
                      setBatchInput(raw);
                      setBatch(isFinite(n) && n > 0 ? Math.min(999, n) : 1);
                    }}
                    onBlur={() => setBatchInput(String(batch))}
                    aria-label="Number of plates"
                    style={{
                      width: 54, minHeight: 34, textAlign: 'center',
                      fontFamily: 'var(--ht-display)', fontSize: 17, fontWeight: 600, color: 'var(--ht-ink)',
                      background: 'var(--ht-field)', border: '1px solid var(--ht-clay)',
                      borderRadius: 'var(--ht-radius-field)', outline: 'none'
                    }}
                  />
                  <button type="button" onClick={() => { const n = Math.min(999, batch + 1); setBatch(n); setBatchInput(String(n)); }} aria-label="More plates" style={stepStyle}>+</button>
                </div>
              </div>

              <div className="ht-rule" style={{ marginBottom: 6 }}>
                <span className="ht-orn">Ingredients</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {lines.map(({ ing, i }) => {
                  const done = !!checked[i];
                  const amt = Number(ing.amount) * batch;
                  const priced = ing.lineCost != null;
                  return (
                    <label
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
                        borderBottom: '1px solid var(--ht-hairline)', cursor: 'pointer', minHeight: 44
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
                        style={{ width: 17, height: 17, flex: '0 0 17px', accentColor: 'var(--ht-olive)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 78, whiteSpace: 'nowrap', color: done ? 'var(--ht-muted)' : 'var(--ht-ink)' }}>
                        {num(amt)} {ing.unit}
                      </span>
                      <span style={{ fontSize: 15, flex: 1, minWidth: 0, color: done ? 'var(--ht-muted)' : 'var(--ht-ink)', textDecoration: done ? 'line-through' : 'none' }}>
                        {ing.name}
                      </span>
                      {showMoney ? (
                        <span
                          style={{
                            fontSize: 14, fontWeight: priced ? 600 : 700, whiteSpace: 'nowrap',
                            textAlign: 'right', minWidth: 74,
                            color: done ? 'var(--ht-muted)' : 'var(--ht-plum)',
                            fontStyle: priced ? 'normal' : 'italic'
                          }}
                        >
                          {priced ? money(Number(ing.lineCost) * batch) : 'No price'}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>

              {ingPageCount > 1 ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                  {Array.from({ length: ingPageCount }, (_, n) => (
                    <button key={n} type="button" onClick={() => setIpage(n)} style={pageBtnStyle(n === ip)}>{n + 1}</button>
                  ))}
                </div>
              ) : null}

              {showMoney ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ht-clay)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span className="ht-orn">{batch > 1 ? `Cost ×${batch}` : 'Dish cost'}</span>
                    <span style={{ fontFamily: 'var(--ht-display)', fontSize: 26, fontWeight: 600 }}>
                      {money(detail.total * batch)}{detail.missing ? '+' : ''}
                    </span>
                  </div>
                  <Link to={`/builder?edit=${open.id}`} className="ht-sec" style={{ textDecoration: 'none' }}>Edit dish</Link>
                </div>
              ) : null}

              {showMoney && detail.missing ? (
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ht-body)', margin: '12px 0 0' }}>
                  {detail.missing === 1 ? 'One ingredient has' : `${detail.missing} ingredients have`} no price — the food was removed from the master list, so this total is incomplete.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Grid ───────────────────────────────────────────────────────────── */

  const courseChips = [{ key: 'all', label: 'All courses' }].concat(
    TYPES.filter(t => counts[t.key]).map(t => ({ key: t.key, label: `${t.label} · ${counts[t.key]}` }))
  );

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 10 }}>
        The kitchen’s menu
      </div>
      <h1 style={{ fontFamily: 'var(--ht-display)', fontSize: 30, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.25, textWrap: 'balance' }}>
        Dishes
      </h1>
      <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 24px', maxWidth: '62ch', textWrap: 'pretty' }}>
        Every dish the kitchen has costed. Open one to see its ingredients, amounts, and where the money goes.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setMpage(0); }}
          placeholder="Search a dish or an ingredient — “matcha”, “tart”"
          style={{
            width: '100%', minHeight: 48, padding: '12px 15px',
            fontFamily: 'var(--ht-body-font)', fontSize: 15, color: 'var(--ht-ink)',
            background: 'var(--ht-field)', border: '1px solid var(--ht-hairline)',
            borderRadius: 'var(--ht-radius-field)', outline: 'none'
          }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {courseChips.map(c => (
            <button key={c.key} type="button" onClick={() => { setCourse(c.key); setMpage(0); }} style={chipStyle(course === c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        {showMoney ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'photo', label: 'With photo' },
              { key: 'missing', label: 'Needs pricing' }
            ].map(f => (
              <button key={f.key} type="button" onClick={() => { setFilter(f.key); setMpage(0); }} style={chipStyle(filter === f.key)}>
                {f.label}
              </button>
            ))}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ht-olive)' }}>Sort</span>
            {[
              { key: 'name', label: 'A–Z' },
              { key: 'low', label: 'Cheapest' },
              { key: 'high', label: 'Priciest' }
            ].map(s => (
              <button key={s.key} type="button" onClick={() => { setSort(s.key); setMpage(0); }} style={chipStyle(sort === s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        ) : null}

        <div style={{ fontSize: 13, color: 'var(--ht-body)' }}>
          {visible.length === dishes.length
            ? `${dishes.length} ${dishes.length === 1 ? 'dish' : 'dishes'}`
            : `${visible.length} of ${dishes.length} dishes`}
        </div>
      </div>

      {visible.length ? (
        <div className="ht-menu">
          {pageDishes.map(({ d, c }) => {
            const n = (d.ingredients || []).length;
            const [, ink] = TINTS[d.type] || ['', '#8C8474'];
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => openDish(d.id)}
                style={{
                  textAlign: 'left', padding: 0, overflow: 'hidden', cursor: 'pointer',
                  border: '1px solid var(--ht-hairline)', background: 'var(--ht-field)',
                  borderRadius: 'var(--ht-radius-card)', fontFamily: 'var(--ht-body-font)',
                  display: 'flex', flexDirection: 'column'
                }}
              >
                <span className="ht-cardphoto" style={photoStyle(d)}>
                  {!d.photo ? (
                    <span style={{ fontFamily: 'var(--ht-display)', fontSize: 30, fontWeight: 600, color: ink, opacity: 0.75 }}>
                      {monogram(d)}
                    </span>
                  ) : null}
                </span>
                <span style={{ display: 'block', padding: '16px 18px 18px' }}>
                  <span style={{ display: 'block', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 6 }}>
                    {typeLabel(d.type)}
                  </span>
                  <span style={{ display: 'block', fontFamily: 'var(--ht-display)', fontSize: 19, fontWeight: 600, lineHeight: 1.3, color: 'var(--ht-ink)' }}>
                    {d.name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--ht-olive)' }}>
                      {n === 1 ? '1 ingredient' : `${n} ingredients`}
                    </span>
                    {showMoney ? (
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ht-plum)' }}>
                        {money(c.total)}{c.missing ? '+' : ''}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={dishes.length ? 'Nothing matches' : 'No dishes costed yet'}
          body={dishes.length ? 'Try another word, or clear the filter.' : 'Build the first one and it lands here.'}
          action={!dishes.length && showMoney ? <Link to="/builder" className="ht-pri" style={{ textDecoration: 'none' }}>New dish</Link> : null}
        />
      )}

      {mPageCount > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 }}>
          {mPageCount > 3 ? (
            <button type="button" onClick={() => setMpage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} aria-label="Previous page" style={pageBtnStyle(false, currentPage === 0)}>‹</button>
          ) : null}
          {pageWindow(mPageCount, currentPage, 3).map(n => (
            <button key={n} type="button" onClick={() => setMpage(n)} style={pageBtnStyle(n === currentPage)}>{n + 1}</button>
          ))}
          {mPageCount > 3 ? (
            <button type="button" onClick={() => setMpage(Math.min(mPageCount - 1, currentPage + 1))} disabled={currentPage === mPageCount - 1} aria-label="Next page" style={pageBtnStyle(false, currentPage === mPageCount - 1)}>›</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
