import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '../auth/useSession.js';
import { COPYRIGHT_YEAR, SiteFooter } from '../components/SiteFooter.jsx';

/**
 * Facts these notices rest on — change them here, not in the prose.
 *
 * Set CONTACT_EMAIL before handoff. Until then, questions route to the
 * kitchen manager, which is how the design already handles every other
 * account matter.
 */
const LAST_UPDATED = 'September 6, 2026';
const CONTACT_EMAIL = null;
const OPERATOR = 'Holiday Thyme';
const DEVELOPER = 'Mahmood Idelbi';
const SESSION_HOURS = 8;
const SERVER_LOCATION = 'a DigitalOcean data centre in New Jersey, United States';
const GOVERNING_LAW = 'the Commonwealth of Virginia';

const SECTIONS = [
  { id: 'privacy', label: 'Privacy' },
  { id: 'terms', label: 'Terms of use' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'credits', label: 'Credits & licences' }
];

const h2 = { fontFamily: 'var(--ht-display)', fontSize: 26, fontWeight: 600, lineHeight: 1.25, margin: '0 0 6px', textWrap: 'balance' };
const h3 = { fontSize: 15, fontWeight: 700, margin: '22px 0 6px', color: 'var(--ht-ink)' };
const p = { fontSize: '14.5px', lineHeight: 1.75, color: 'var(--ht-body)', margin: '0 0 12px', maxWidth: '68ch', textWrap: 'pretty' };
const ul = { ...p, paddingLeft: 22 };
const code = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '13px', background: '#F3EFE4', padding: '1px 6px', borderRadius: 6 };

function Contact() {
  return CONTACT_EMAIL
    ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    : <strong style={{ fontWeight: 600, color: 'var(--ht-ink)' }}>the kitchen manager</strong>;
}

export function LegalScreen() {
  const { user } = useSession();
  const { hash } = useLocation();

  // Land on the section the footer link named.
  useEffect(() => {
    const id = hash.replace('#', '');
    const el = id && document.getElementById(id);
    if (el) el.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ht-bg)' }}>
      <header className="ht-header">
        <Link to={user ? '/' : '/login'} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ht-ink)' }}>
          <img src="/assets/logo-badge.png" alt="Holiday Thyme" style={{ width: 38, height: 38, display: 'block' }} />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontFamily: 'var(--ht-display)', fontSize: 18, fontWeight: 600 }}>Holiday Thyme</span>
            <span style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginTop: 4 }}>
              Kitchen Operations
            </span>
          </span>
        </Link>
        <Link to={user ? '/' : '/login'} className="ht-sec" style={{ textDecoration: 'none', borderWidth: 1, fontSize: 13 }}>
          {user ? '← Dashboard' : '← Sign in'}
        </Link>
      </header>

      <main className="ht-page" style={{ maxWidth: 820 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ht-olive)', marginBottom: 10 }}>
          The small print
        </div>
        <h1 style={{ fontFamily: 'var(--ht-display)', fontSize: 32, fontWeight: 600, lineHeight: 1.2, margin: '0 0 8px', textWrap: 'balance' }}>
          Privacy, terms, cookies and credits
        </h1>
        <p style={{ ...p, marginBottom: 18 }}>
          This is an internal tool for the {OPERATOR} kitchen. It exists so the chefs can price ingredients and cost
          dishes, and so the line can read the menu. It has no public visitors, no advertising and no tracking, which
          keeps this page short. Last updated {LAST_UPDATED}.
        </p>

        <nav aria-label="On this page" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 34 }}>
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                padding: '0 14px', minHeight: 36, display: 'inline-flex', alignItems: 'center',
                borderRadius: 'var(--ht-radius-pill)', fontSize: 13, fontWeight: 600,
                color: 'var(--ht-body)', border: '1px solid var(--ht-hairline)', background: 'var(--ht-field)'
              }}
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* ── Privacy ─────────────────────────────────────────────────── */}
        <section id="privacy" style={{ scrollMarginTop: 90, marginBottom: 44 }}>
          <div className="ht-orn" style={{ marginBottom: 8 }}>Privacy notice</div>
          <h2 style={h2}>What this tool knows about you</h2>

          <h3 style={h3}>Who runs it</h3>
          <p style={p}>
            The tool is operated by {OPERATOR} for its own staff. It was built and is hosted by {DEVELOPER} under a
            development agreement with {OPERATOR}. {OPERATOR} owns every piece of business data inside it; the developer
            has server access to keep it running and for nothing else.
          </p>

          <h3 style={h3}>What is held about you</h3>
          <p style={p}>Your account is small on purpose. It consists of:</p>
          <ul style={ul}>
            <li>a username, chosen by the kitchen manager;</li>
            <li>a role — admin, chef or kitchen staff — which decides what you can see;</li>
            <li>a scrambled form of your password. The password itself is never stored, and nobody can read it back;</li>
            <li>the date the account was made, and whether it is active.</li>
          </ul>
          <p style={p}>
            No email address, phone number, home address or photo of you is collected. Nothing on this tool identifies
            you beyond your username.
          </p>

          <h3 style={h3}>Business records are not personal records</h3>
          <p style={p}>
            Ingredients, prices, dishes, amounts and dish photos are {OPERATOR}’s business data. They belong to
            {' '}{OPERATOR} and are not information about any person.
          </p>

          <h3 style={h3}>Signing in</h3>
          <p style={p}>
            When you sign in, the server gives your browser a single cookie that says “this person is signed in”. It
            lasts {SESSION_HOURS} hours, is cleared when you sign out, and the server can end it early — for instance
            when an account is deactivated or a password is reset. See the <a href="#cookies">cookie section</a>.
          </p>

          <h3 style={h3}>Who can see your account</h3>
          <p style={p}>
            Admins see the list of accounts — usernames, roles, status and creation dates — because they create and
            manage them. Chefs and kitchen staff cannot see anything about other accounts. Money figures are never
            sent to kitchen-staff accounts at all; the server leaves them out rather than merely hiding them.
          </p>

          <h3 style={h3}>Where it lives, and who else is involved</h3>
          <p style={p}>The application and its database run on a server in {SERVER_LOCATION}. Three other services take part:</p>
          <ul style={ul}>
            <li>
              <strong style={{ fontWeight: 600 }}>Netlify</strong> delivers the website’s files to your browser from its
              network. Like any web host it may keep standard access logs — the address of the device that asked, and
              when.
            </li>
            <li>
              <strong style={{ fontWeight: 600 }}>Google Fonts</strong> supplies the two typefaces. Your browser fetches
              them from Google, which sees the request come from your device.
            </li>
            <li>
              <strong style={{ fontWeight: 600 }}>Wikimedia Commons</strong> hosts some dish photos. When a dish shows
              such a photo, your browser fetches it from Wikimedia, which sees the request.
            </li>
          </ul>
          <p style={p}>
            None of these receives your username, your role or anything from inside the tool. Nothing is sold, shared
            for advertising, or analysed for anything but keeping the tool running and secure.
          </p>

          <h3 style={h3}>Keeping and removing accounts</h3>
          <p style={p}>
            Accounts are deactivated rather than deleted, so the kitchen’s history stays intact. A deactivated account
            cannot sign in. If you leave {OPERATOR} and want your username removed entirely, ask <Contact />.
          </p>

          <h3 style={h3}>Questions or corrections</h3>
          <p style={p}>
            The kitchen manager sets up accounts, changes roles and resets passwords. For anything about how your
            information is handled, contact <Contact />.
          </p>
        </section>

        {/* ── Terms ───────────────────────────────────────────────────── */}
        <section id="terms" style={{ scrollMarginTop: 90, marginBottom: 44 }}>
          <div className="ht-orn" style={{ marginBottom: 8 }}>Terms of use</div>
          <h2 style={h2}>How the tool may be used</h2>

          <h3 style={h3}>Who may use it</h3>
          <p style={p}>
            Only people {OPERATOR} has given an account to, and only for {OPERATOR}’s business. Access is granted by the
            kitchen manager and may be withdrawn at any time.
          </p>

          <h3 style={h3}>Your account is yours alone</h3>
          <ul style={ul}>
            <li>Keep your password to yourself and do not share your account.</li>
            <li>If you think someone else has used it, tell the kitchen manager so the password can be reset.</li>
            <li>Do not try to reach screens or records your role does not open. The server enforces roles regardless of what the screen shows.</li>
          </ul>

          <h3 style={h3}>Prices and costs</h3>
          <p style={p}>
            Ingredient prices and dish costs are working figures the kitchen maintains. They are as current as the
            last person to update them and are provided to help the kitchen plan, not as a guarantee of any price.
          </p>

          <h3 style={h3}>The software</h3>
          <p style={p}>
            The application is licensed to {OPERATOR}, not sold, and may not be copied, resold or redistributed. It is
            provided under the terms of the development agreement between {OPERATOR} and the developer, which sets
            out support and warranty. This page does not extend them.
          </p>

          <h3 style={h3}>Governing law</h3>
          <p style={p}>These terms and the development agreement behind them are governed by the laws of {GOVERNING_LAW}.</p>
        </section>

        {/* ── Cookies ─────────────────────────────────────────────────── */}
        <section id="cookies" style={{ scrollMarginTop: 90, marginBottom: 44 }}>
          <div className="ht-orn" style={{ marginBottom: 8 }}>Cookies & storage</div>
          <h2 style={h2}>One cookie, and nothing that tracks you</h2>

          <h3 style={h3}>The cookie</h3>
          <p style={p}>
            Signing in sets a single cookie named <span style={code}>session</span>. It is strictly necessary — the tool
            cannot know you are signed in without it — so no consent banner is asked for and none is needed.
          </p>
          <ul style={ul}>
            <li>It expires after {SESSION_HOURS} hours, and is removed when you sign out.</li>
            <li>Scripts on the page cannot read it, and it is only ever sent back to this site.</li>
            <li>It contains a signed token, not your password.</li>
          </ul>

          <h3 style={h3}>Browser storage</h3>
          <p style={p}>
            To make Back and Forward behave, the browser remembers your current search and filters for the tab you are
            in. This stays on your device, is never sent anywhere, and is cleared when you sign out or refresh.
          </p>

          <h3 style={h3}>What there is none of</h3>
          <p style={p}>No analytics, no advertising cookies, no third-party trackers, no fingerprinting.</p>
        </section>

        {/* ── Credits ─────────────────────────────────────────────────── */}
        <section id="credits" style={{ scrollMarginTop: 90, marginBottom: 20 }}>
          <div className="ht-orn" style={{ marginBottom: 8 }}>Credits & licences</div>
          <h2 style={h2}>Who made what</h2>

          <h3 style={h3}>The software</h3>
          <p style={p}>
            © {COPYRIGHT_YEAR} {DEVELOPER}. Licensed to {OPERATOR} on a perpetual, non-exclusive basis for its business
            use. The Holiday Thyme name and sprig mark belong to {OPERATOR}.
          </p>

          <h3 style={h3}>Dish photographs</h3>
          <p style={p}>
            Where a dish shows a photo credit, the image comes from{' '}
            <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">Wikimedia Commons</a> and is used under
            the Creative Commons licence its author chose. The credit and a link to the source appear on the dish
            itself. Photos the kitchen adds are the kitchen’s own.
          </p>

          <h3 style={h3}>Typefaces</h3>
          <p style={p}>
            <em>Zen Old Mincho</em> and <em>Murecho</em>, both under the SIL Open Font License 1.1, delivered by Google
            Fonts.
          </p>

          <h3 style={h3}>Open-source software</h3>
          <p style={p}>
            Built with React, React DOM, React Router and Vite, each released under the MIT License. Their notices are
            included in the source.
          </p>
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}
