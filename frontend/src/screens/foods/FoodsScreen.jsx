import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteFood, listFoods } from '../../api/foods-api.js';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { LoadingPanel, RolePanel, UnreachablePanel } from '../../components/Panels.jsx';
import { CountLabel } from '../../components/Toolbar.jsx';
import { money, num, unitPriceLabel, unitPriceOf } from '../../lib/format.js';
import { loadUi, saveUi } from '../../lib/ui-state.js';
import { FoodForm } from './FoodForm.jsx';

const PER_PAGE = 10;

const searchStyle = {
  width: '100%', minHeight: 52, padding: '14px 16px',
  fontFamily: 'var(--ht-body-font)', fontSize: '15.5px', color: 'var(--ht-ink)',
  background: 'var(--ht-field)', border: '1px solid var(--ht-hairline)',
  borderRadius: 'var(--ht-radius-field)', outline: 'none'
};

const headStyle = { fontSize: '10.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ht-olive)' };

export function FoodsScreen() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState('loading');
  const [denied, setDenied] = useState(false);

  const saved = useMemo(() => loadUi('foods') || {}, []);
  const [query, setQuery] = useState(saved.query || '');
  const [page, setPage] = useState(saved.page || 1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);

  const load = useCallback(() => {
    setState('loading');
    listFoods()
      .then(rows => { setItems(rows); setState('ready'); })
      .catch(err => {
        // A 403 here means the role changed under us — the server is the gate.
        if (err.status === 403) { setDenied(true); setState('ready'); }
        else setState('failed');
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { saveUi('foods', { query, page }); }, [query, page]);

  const units = useMemo(
    () => Array.from(new Set(items.map(f => f.unit).filter(Boolean))).sort(),
    [items]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(f =>
      f.name.toLowerCase().includes(q) || String(f.unit || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PER_PAGE;
  const rows = visible.slice(start, start + PER_PAGE);

  const afterWrite = () => {
    setFormOpen(false);
    setEditing(null);
    load();          // the server's answer is fresher than any local merge
  };

  const confirmDelete = async () => {
    const food = pending;
    setPending(null);
    try {
      await deleteFood(food.id);
    } catch (err) {
      if (err.status !== 404) { setState('failed'); return; }
      // 404 means it was already gone — the refetch below settles it either way.
    }
    load();
  };

  if (denied) return <RolePanel variant="foods" roles={['admin', 'chef']} />;
  if (state === 'failed') return <UnreachablePanel title="The master foods list didn’t load" onRetry={load} />;

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 10 }}>
        Price reference
      </div>
      <h1 style={{ fontFamily: 'var(--ht-display)', fontSize: 30, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.25, textWrap: 'balance' }}>
        Master foods list
      </h1>
      <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 24px', maxWidth: '62ch', textWrap: 'pretty' }}>
        What we pay, and what that works out to per unit. Anything on this list is available when building menus and prep lists.
      </p>

      <div className="ht-toolbar">
        <input
          className="ht-search"
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search foods or units"
          style={searchStyle}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, flex: 1, minHeight: 44 }}>
          <CountLabel>
            {visible.length === items.length
              ? `${items.length} ${items.length === 1 ? 'food' : 'foods'}`
              : `${visible.length} of ${items.length} foods`}
          </CountLabel>
          <button type="button" className="ht-pri" onClick={() => { setEditing(null); setFormOpen(true); }}>
            Add food
          </button>
        </div>
      </div>

      <div className="ht-row ht-thead" style={{ padding: '0 18px 10px', borderBottom: '1px solid var(--ht-clay)' }}>
        <div style={headStyle}>Food</div>
        <div className="ht-cells">
          <div style={headStyle}>Qty</div>
          <div style={headStyle}>Unit</div>
          <div style={headStyle}>Price</div>
          <div style={headStyle}>Unit price</div>
        </div>
        <div />
      </div>

      {state === 'loading' ? <LoadingPanel label="Loading the foods list…" /> : null}

      {state === 'ready' && rows.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {rows.map(f => (
            <div key={f.id} className="ht-row" style={{ border: '1px solid var(--ht-hairline)', background: 'var(--ht-field)', borderRadius: 14, padding: '10px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--ht-display)', fontSize: 18, fontWeight: 600, lineHeight: 1.35 }}>{f.name}</span>
              </div>

              <div className="ht-cells">
                <div><span className="ht-lab">Qty</span><span style={{ fontSize: 15 }}>{num(f.qty)}</span></div>
                <div><span className="ht-lab">Unit</span><span style={{ fontSize: 15, color: 'var(--ht-body)' }}>{f.unit}</span></div>
                <div><span className="ht-lab">Price</span><span style={{ fontSize: 15 }}>{money(f.price)}</span></div>
                <div>
                  <span className="ht-lab">Unit price</span>
                  <span style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--ht-plum)', whiteSpace: 'nowrap' }}>
                    {unitPriceLabel(unitPriceOf(f), f.unit)}
                  </span>
                </div>
              </div>

              <div className="ht-acts">
                <button type="button" className="ht-sec" onClick={() => { setEditing(f); setFormOpen(true); }}>Edit</button>
                <button
                  type="button"
                  className="ht-sec ht-sec--muted"
                  onClick={() => setPending(f)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {state === 'ready' && !rows.length ? (
        <div style={{ marginTop: 10 }}>
          <EmptyState
            title={items.length ? 'Nothing matches' : 'Nothing is priced yet'}
            body={items.length
              ? 'Try a different search, or add the food to the list.'
              : 'Add each ingredient with what you pay and the size you buy it in.'}
          />
        </div>
      ) : null}

      {state === 'ready' && rows.length ? (
        <Pagination
          page={current}
          pageCount={pageCount}
          rangeLabel={visible.length === 0
            ? 'No foods'
            : `Showing ${start + 1}–${Math.min(start + PER_PAGE, visible.length)} of ${visible.length}`}
          onGo={(n) => setPage(Math.min(Math.max(1, n), pageCount))}
        />
      ) : null}

      {formOpen ? (
        <FoodForm
          editing={editing}
          units={units}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSaved={afterWrite}
        />
      ) : null}

      {pending ? (
        <ConfirmDialog
          kicker="Delete permanently"
          title={`Delete ${pending.name}?`}
          body="This removes it from the master list for everyone, along with its price history. Menus and prep lists that reference it will lose the price. This can’t be undone."
          confirmLabel="Delete food"
          onConfirm={confirmDelete}
          onCancel={() => setPending(null)}
        />
      ) : null}
    </div>
  );
}
