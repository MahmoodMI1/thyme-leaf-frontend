import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../auth/useSession.js';
import { allowed } from '../lib/nav.js';
import { listDishes, typeLabel } from '../api/dishes-api.js';
import { listFoods } from '../api/foods-api.js';
import { listUsers } from '../api/users-api.js';
import { LoadingPanel, UnreachablePanel } from '../components/Panels.jsx';

const TILES = {
  menu: ['#E9EADA', '#77794F'],
  builder: ['#F3E7E6', '#9F4A54'],
  foods: ['#EFE9DC', '#B7A97E'],
  users: ['#E7EBE3', '#5F6140']
};

const KICKERS = { menu: 'For the line', builder: 'Costing', foods: 'Prices', users: 'Access' };
const CTAS = { menu: 'Open the menu', builder: 'Cost a dish', foods: 'See prices', users: 'Manage accounts' };

const COURSE_TINTS = {
  canapes: ['#EFE9DC', '#B7A97E'], entrees: ['#E9EADA', '#77794F'],
  mains: ['#E4E3D2', '#5F6140'], sides: ['#F0EBDD', '#8C8474'],
  sweets: ['#F3E7E6', '#9F4A54'], tea: ['#E7EBE3', '#6E7A5E'],
  components: ['#EDE8DE', '#6E6759']
};

// Freely-licensed Commons photos, credited in the footer of this page. Card art
// comes from the kitchen's own data where possible: the menu card shows a real
// dish, the foods card a real ingredient.
const commons = (name) => 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(name) + '?width=900';

function photoFor(key, dishes) {
  const byName = (frag) => (dishes.find(d => d.photo && d.name.toLowerCase().includes(frag)) || {}).photo;
  if (key === 'menu') return byName('tart') || (dishes.find(d => d.photo) || {}).photo;
  if (key === 'builder') return commons('Mise en place.jpg');
  if (key === 'foods') return commons('Tomatoes.jpg');
  if (key === 'users') return commons('Chef cooking.jpg');
  return null;
}

const stepNum = (done) => ({
  flex: '0 0 auto', width: 28, height: 28, borderRadius: 'var(--ht-radius-pill)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--ht-display)', fontSize: 14, fontWeight: 600,
  background: done ? '#E7EBE3' : 'var(--ht-ink)',
  color: done ? '#5F6140' : 'var(--ht-bg)'
});

const stepCta = {
  display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
  background: 'var(--ht-plum)', color: 'var(--ht-bg)', borderRadius: 'var(--ht-radius-pill)',
  padding: '0 16px', minHeight: 40, fontSize: '13.5px', fontWeight: 700
};

export function Dashboard() {
  const { user } = useSession();
  const role = user.role;
  const isStaff = role === 'staff';
  const isAdmin = role === 'admin';

  const [dishes, setDishes] = useState([]);
  const [counts, setCounts] = useState({ dishes: 0, foods: null, users: null, courses: 0 });
  const [state, setState] = useState('loading');

  const load = useCallback(() => {
    setState('loading');

    // Only ask for what this role is allowed to read. Staff would 403 on foods,
    // and chefs on users — those requests are the caller's mistake, not the
    // server's, so they are never made.
    const jobs = [
      listDishes(),
      isStaff ? Promise.resolve(null) : listFoods().catch(() => null),
      isAdmin ? listUsers().catch(() => null) : Promise.resolve(null)
    ];

    Promise.all(jobs)
      .then(([dishList, foodList, userList]) => {
        setDishes(dishList);
        setCounts({
          dishes: dishList.length,
          courses: new Set(dishList.map(d => d.type)).size,
          foods: foodList ? foodList.length : null,
          users: userList ? userList.filter(u => u.status === 'active').length : null
        });
        setState('ready');
      })
      .catch(() => setState('failed'));
  }, [isStaff, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const pages = useMemo(() => allowed(role), [role]);
  const cards = pages.filter(p => p.key !== 'dashboard');
  const recent = dishes.slice(-3).reverse();

  if (state === 'loading') return <LoadingPanel label="Opening the kitchen…" />;
  if (state === 'failed') return <UnreachablePanel title="The dashboard didn’t load" onRetry={load} />;

  const roleWord = role === 'admin' ? 'admin' : role === 'chef' ? 'chef' : 'kitchen staff';

  const stats = [
    { label: 'Dishes costed', value: String(counts.dishes) },
    { label: 'Courses in use', value: String(counts.courses) }
  ];
  if (counts.foods != null) stats.push({ label: 'Foods priced', value: String(counts.foods) });
  if (counts.users != null) stats.push({ label: 'Active accounts', value: String(counts.users) });

  // Staff never sees the foods count, so their "nothing set up yet" state keys
  // off the menu being empty instead.
  const noFoods = counts.foods === 0;
  const firstRun = isStaff ? counts.dishes === 0 : (noFoods || counts.dishes === 0);

  const blurb = role === 'admin'
    ? 'Prices, dishes and accounts all run through you. Start wherever the day starts.'
    : role === 'chef'
      ? 'Cost a plate, check what an ingredient runs, or pull up the menu before service.'
      : 'The menu and its ingredients, ready for the line. Costing is handled by the chefs.';

  const accessNote = role === 'admin'
    ? 'You see every screen because you’re the admin.'
    : role === 'chef'
      ? 'Staff accounts are admin-only — ask the kitchen manager.'
      : 'Costing screens are chef-only. You see the menu and prep detail.';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 10 }}>
        Signed in as {roleWord}
      </div>
      <h1 style={{ fontFamily: 'var(--ht-display)', fontSize: 32, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.2, textWrap: 'balance' }}>
        Good day, {user.username}
      </h1>
      <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 28px', maxWidth: '60ch', textWrap: 'pretty' }}>
        {blurb}
      </p>

      {firstRun ? (
        <div style={{ border: '1px solid var(--ht-clay)', background: 'var(--ht-field)', borderRadius: 'var(--ht-radius-card)', padding: '26px 24px', marginBottom: 30 }}>
          <div style={{ fontSize: '10.5px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--ht-plum)', marginBottom: 12 }}>
            Start here
          </div>
          <div style={{ fontFamily: 'var(--ht-display)', fontSize: 25, fontWeight: 600, lineHeight: 1.3, marginBottom: 10, textWrap: 'balance' }}>
            {isStaff || noFoods ? 'Nothing is priced yet' : 'The prices are in — now cost a dish'}
          </div>
          <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', margin: '0 0 22px', maxWidth: '60ch', textWrap: 'pretty' }}>
            {isStaff
              ? 'The chefs are still setting the kitchen up. Once dishes are costed they’ll appear here for the line.'
              : 'Two steps and the kitchen is running: price what you buy, then build a dish from it. Costs work themselves out from there.'}
          </p>

          {isStaff ? null : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  n: '1', title: 'Price what you buy',
                  note: 'Add each ingredient with what you pay and the size you buy it in.',
                  cta: 'Master foods', href: noFoods ? '/foods' : null, done: counts.foods > 0
                },
                {
                  n: '2', title: 'Cost your first dish',
                  note: 'Name it, pull ingredients from the list, and the plate cost adds itself up.',
                  cta: 'Dish builder', href: counts.foods > 0 && counts.dishes === 0 ? '/builder' : null, done: counts.dishes > 0
                }
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid var(--ht-hairline)', paddingTop: 12 }}>
                  <span style={stepNum(s.done)}>{s.n}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{s.title}</span>
                    <span style={{ display: 'block', fontSize: '13.5px', lineHeight: 1.6, color: 'var(--ht-body)', marginTop: 2 }}>{s.note}</span>
                  </span>
                  {s.done ? (
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#5F6140', whiteSpace: 'nowrap' }}>Done</span>
                  ) : s.href ? (
                    <Link to={s.href} style={stepCta}>{s.cta}</Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="ht-stats" style={{ marginBottom: 30 }}>
        {stats.map(s => (
          <div key={s.label} style={{ border: '1px solid var(--ht-hairline)', background: 'var(--ht-field)', borderRadius: 14, padding: '15px 16px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 7 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--ht-display)', fontSize: 25, fontWeight: 600, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span className="ht-orn">Where to go</span>
        <span style={{ flex: 1, height: 1, background: 'var(--ht-hairline)' }} />
      </div>

      <div className="ht-grid">
        {cards.map(p => {
          const [bg, ink] = TILES[p.key] || ['#F3EFE4', '#77794F'];
          const photo = photoFor(p.key, dishes);
          return (
            <Link
              key={p.key}
              to={p.href}
              style={{
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                border: '1px solid var(--ht-hairline)', background: 'var(--ht-field)',
                borderRadius: 'var(--ht-radius-card)', color: 'var(--ht-ink)', minHeight: 250
              }}
            >
              <span
                style={{
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start',
                  height: 132, flex: '0 0 132px', padding: '12px 16px',
                  borderBottom: '1px solid var(--ht-hairline)', backgroundColor: bg,
                  ...(photo
                    ? {
                      backgroundImage: `linear-gradient(to top, rgba(60,55,45,0.55), rgba(60,55,45,0.05) 60%), url("${photo}")`,
                      backgroundSize: 'cover', backgroundPosition: 'center'
                    }
                    : { backgroundImage: `repeating-linear-gradient(135deg, ${ink}24 0 2px, transparent 2px 11px)` })
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--ht-display)', fontSize: 20, fontWeight: 600,
                    color: photo ? 'var(--ht-bg)' : ink,
                    opacity: photo ? 1 : 0.8, lineHeight: 1, letterSpacing: '0.02em'
                  }}
                >
                  {photo ? '' : p.label[0]}
                </span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 22px 22px' }}>
                <span style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 8 }}>
                  {KICKERS[p.key] || ''}
                </span>
                <span style={{ fontFamily: 'var(--ht-display)', fontSize: 25, fontWeight: 600, lineHeight: 1.25 }}>{p.label}</span>
                <span style={{ display: 'block', fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ht-body)', marginTop: 8, minHeight: 48, textWrap: 'pretty' }}>
                  {p.note}
                </span>
                <span style={{ flex: 1 }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: '13.5px', fontWeight: 700, color: 'var(--ht-plum)' }}>
                  {CTAS[p.key] || 'Open'} <span aria-hidden="true">→</span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {recent.length ? (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span className="ht-orn">Latest on the menu</span>
            <span style={{ flex: 1, height: 1, background: 'var(--ht-hairline)' }} />
            <Link to="/menu" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ht-olive)' }}>See all</Link>
          </div>
          <div className="ht-grid">
            {recent.map(d => {
              const [bg, ink] = COURSE_TINTS[d.type] || ['#F3EFE4', '#77794F'];
              return (
                <Link
                  key={d.id}
                  to="/menu"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    border: '1px solid var(--ht-hairline)', background: 'var(--ht-field)',
                    borderRadius: 14, padding: '14px 16px', color: 'var(--ht-ink)'
                  }}
                >
                  <span
                    style={{
                      flex: '0 0 auto', width: 44, height: 44, borderRadius: 10,
                      ...(d.photo
                        ? { backgroundImage: `url("${d.photo}")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'var(--ht-ink)' }
                        : { backgroundColor: bg, backgroundImage: `repeating-linear-gradient(135deg, ${ink}24 0 2px, transparent 2px 9px)` })
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 4 }}>
                      {typeLabel(d.type)}
                    </span>
                    <span style={{ display: 'block', fontFamily: 'var(--ht-display)', fontSize: 17, fontWeight: 600, lineHeight: 1.3 }}>
                      {d.name}
                    </span>
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ht-plum)', whiteSpace: 'nowrap' }}>
                    {(d.ingredients || []).length} ingredients
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 30, paddingTop: 16, borderTop: '1px solid var(--ht-hairline)' }}>
        <span style={{ fontSize: 13, color: 'var(--ht-muted)' }}>
          {accessNote}{' '}
          <span style={{ color: '#A8A08F' }}>
            · Card photos from{' '}
            <a href="https://commons.wikimedia.org" target="_blank" rel="noopener" style={{ color: 'var(--ht-muted)', textDecoration: 'underline' }}>
              Wikimedia Commons
            </a>
          </span>
        </span>
      </div>
    </div>
  );
}
