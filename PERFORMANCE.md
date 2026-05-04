# Performance Report — BMP.tn Frontend

> **Lighthouse version:** 13.0.2  
> **Tested page:** `http://localhost:5173/artisan` (Artisan Dashboard)  
> **Test date:** 2026-05-04  
> **Environment:** Desktop simulation, Vite dev server (unminified)

---

## 1. Lighthouse Scores — Before Optimizations

| Category        | Score |
|-----------------|-------|
| 🔴 Performance  | 64 / 100 |
| 🟡 Accessibility | 88 / 100 |
| 🟢 Best Practices | 100 / 100 |
| 🟢 SEO          | 100 / 100 |

---

## 2. Core Web Vitals — Before

| Metric | Value | Rating |
|--------|-------|--------|
| **FCP** (First Contentful Paint) | 2.1 s | 🔴 Poor (score: 0.25) |
| **LCP** (Largest Contentful Paint) | 4.3 s | 🔴 Poor (score: 0.14) |
| **TBT** (Total Blocking Time) | 20 ms | 🟢 Good (score: 1.0) |
| **CLS** (Cumulative Layout Shift) | 0.056 | 🟢 Good (score: 0.98) |
| **Speed Index** | 2.6 s | 🟡 Needs Improvement (score: 0.37) |
| **TTI** (Time to Interactive) | 4.3 s | 🟡 Needs Improvement (score: 0.53) |

---

## 3. Diagnostics — Before

### Bundle Size (Transfer)
| Resource | Size |
|----------|------|
| `react-dom_client.js` | 1,005 KB |
| `lucide-react.js` | 962 KB |
| `react-router-dom.js` | 452 KB |
| `App.jsx` | 217 KB |
| `@vite/client` | 179 KB |
| `index.css` | 156 KB |
| `DashboardTopbar.jsx` | 139 KB |
| `ArtisanDashboard.jsx` | 123 KB |
| `socket.io-client.js` | 108 KB |
| **Total transfer** | **4,206 KB** |

### Unused JavaScript — Est. savings: 870 KB
| File | Wasted |
|------|--------|
| `react-router-dom.js` | 395 KB (87%) |
| `react-dom_client.js` | 333 KB (33%) |
| `chunk-F3JXESEM.js` (i18next) | 54 KB (67%) |
| `react-i18next.js` | 41 KB (78%) |
| `socket.io-client.js` | 41 KB (38%) |

### Unminified JavaScript — Est. savings: 1,694 KB
> This is a **dev server** measurement. Production build with Terser eliminates this entirely.

### Network Dependency Chain
- Longest chain: 1,706 ms (artisan → main.jsx → react → ArtisanDashboard → dashboard-summary API)
- Critical path depth: 8 levels

### Layout Shifts (CLS: 0.056)
| Element | Score |
|---------|-------|
| `<footer>` (loads after content) | 0.056 |
| `<button>` ReadPageButton (fixed position) | 0.0003 |

### bfcache Failure
- **Reason:** WebSocket connection prevents back/forward cache restoration

---

## 4. Accessibility Issues — Before

| Issue | Impact | Elements |
|-------|--------|----------|
| Buttons without accessible names | Critical | 2 buttons in mobile header |
| Insufficient color contrast (4.5:1 required) | Serious | 6 stat card labels (`text-slate-400` on white) |

---

## 5. Optimizations Applied

### 5.1 Vite Build Configuration (`vite.config.js`)

**Problem:** No manual chunk splitting, no compression, incorrect `optimizeDeps`.

**Fix:**
- Added `vite-plugin-compression2` for **gzip + brotli** pre-compression of all JS/CSS assets
- Implemented `manualChunks` strategy splitting vendors into 9 focused chunks:
  - `vendor-react` (React core — always needed)
  - `vendor-router` (React Router)
  - `vendor-socket` (Socket.io — post-login only)
  - `vendor-stripe` (Stripe — subscription page only)
  - `vendor-charts` (Recharts — dashboard/analytics only)
  - `vendor-i18n` (i18next + react-i18next)
  - `vendor-icons` (lucide-react — tree-shaken)
  - `vendor-exports` (xlsx + jsPDF — on-demand only)
  - `vendor-ml` (TensorFlow + Face-API — FaceId page only)
- Fixed `optimizeDeps.include` (removed non-existent `lodash`, `clsx`)
- Externalized missing TF peer deps to prevent build failure

**Impact:** Each page now loads only the vendor chunks it actually needs.

---

### 5.2 Stripe Lazy Loading (`ArtisanSubscription.jsx`)

**Problem:** `const stripePromise = loadStripe(...)` executed at module parse time — Stripe SDK loaded on **every page** even when user never visits the subscription page.

**Fix:**
```js
// ❌ Before — fires on every page load
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// ✅ After — fires only when payment form renders
let stripePromise = null;
function getStripePromise() {
  if (!stripePromise) {
    stripePromise = import('@stripe/stripe-js').then(({ loadStripe }) =>
      loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
    );
  }
  return stripePromise;
}

const LazyStripePayment = React.lazy(async () => {
  const [{ Elements }, { default: StripePaymentForm }, stripe] = await Promise.all([
    import('@stripe/react-stripe-js'),
    import('../components/StripePaymentForm'),
    getStripePromise(),
  ]);
  // ...
});
```

**Impact:** Stripe (~17 KB gzip) removed from initial bundle. Loaded only when user selects a plan.

---

### 5.3 Parallel API Calls (`ArtisanDashboard.jsx`)

**Problem:** Two sequential `await` calls on dashboard load — each waits for the previous to complete.

**Fix:**
```js
// ❌ Before — sequential (2 round-trips in series)
const data = await getArtisanDashboardSummary({ token });
getMySubscription({ token }).then(res => { ... });

// ✅ After — parallel (both fire simultaneously)
const [data, subRes] = await Promise.all([
  getArtisanDashboardSummary({ token }),
  getMySubscription({ token }).catch(() => null),
]);
```

**Impact:** Saves one full API round-trip (~130–400 ms depending on server latency) on every dashboard load.

---

### 5.4 Clock Isolation (`DashboardTopbar.jsx`)

**Problem:** `setInterval` ticking every second caused the **entire topbar** (search, avatar, notifications, voice button) to re-render 60 times/minute.

**Fix:** Extracted clock into an isolated `LiveClock` component wrapped in `React.memo`:
```js
// ✅ Only this tiny component re-renders every second
const LiveClock = React.memo(function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <div className="min-w-[180px] text-sm ...">{/* formatted date */}</div>;
});
```

**Impact:** Eliminates ~60 unnecessary re-renders/minute of the topbar and all its children (NotificationBell, LanguageSwitcher, DarkModeToggle, voice button, avatar).

---

### 5.5 React.memo on Hot-Path Components

**Problem:** Components re-rendering unnecessarily on every parent state change.

**Fix:** Applied `React.memo` to:
- `StatCard` in `ArtisanDashboard` — prevents re-render when `refreshing` state changes
- `ActionCard` in `ArtisanDashboard` — same
- `SectionHeader` in `ArtisanDashboard` — same
- `NotificationBell` — prevents re-render on every topbar clock tick
- `RealtimeNotifications` — prevents re-render on auth context changes

---

### 5.6 Async i18n Translation Loading (`i18n.js`)

**Problem:** French translation JSON (~17 KB) was eagerly imported at module parse time, blocking the initial JS evaluation chain.

**Fix:**
```js
// ❌ Before — blocks parse
import frTranslation from './locales/fr/translation.json';
i18n.init({ resources: { fr: { translation: frTranslation } } });

// ✅ After — non-blocking
i18n.init({ resources: {} }); // init immediately with empty resources
import('./locales/fr/translation.json').then((module) => {
  i18n.addResourceBundle('fr', 'translation', module.default, true, true);
});
```

**Impact:** Removes the translation JSON from the synchronous module evaluation chain. Translations load asynchronously after the app renders.

---

### 5.7 Resource Hints (`index.html`)

**Problem:** Browser had to discover external origins (Stripe, API server) only after JS executed.

**Fix:** Added `<link rel="preconnect">` and `<link rel="dns-prefetch">` for:
- `https://js.stripe.com` — Stripe SDK
- `http://localhost:5000` — API server
- `https://ipapi.co` — IP geolocation (used in `api.js`)

**Impact:** DNS resolution and TCP handshakes start before JS executes, reducing TTFB for first API calls.

---

### 5.8 NotificationBell Bug Fix

**Problem:** `token` and `navigate` were used but never destructured from hooks — caused `ReferenceError: token is not defined` crash after login.

**Fix:**
```js
// ✅ Added missing hook calls
const { token, isAuthenticated } = useAuth();
const navigate = useNavigate();

// ✅ Guard all effects and handlers
if (!isAuthenticated) return null;
useEffect(() => { if (!token) return; loadCount(); }, [isAuthenticated, loadCount]);
```

**Impact:** Eliminated runtime crash. Component now renders nothing before login, preventing all API calls and polling.

---

## 6. Build Output — After Optimizations

### Chunk Sizes (gzip)
| Chunk | Gzip Size | Loaded When |
|-------|-----------|-------------|
| `vendor-react` | 59.9 KB | Always |
| `vendor-router` | 12.3 KB | Always |
| `vendor-i18n` | 14.9 KB | Always |
| `vendor-icons` | 11.9 KB | On demand |
| `vendor-socket` | 9.6 KB | After login |
| `vendor-stripe` | 5.5 KB | Subscription page |
| `vendor-charts` | 83.1 KB | Dashboard/analytics |
| `vendor-exports` | 243 KB | Export actions |
| `vendor-ml` | 358 KB | FaceId page only |
| `index.js` (app entry) | 8.7 KB | Always |
| `ArtisanDashboard` | 4.6 KB | Artisan dashboard |
| CSS | 17.9 KB | Always |

### Compression
All assets now ship with `.gz` and `.br` pre-compressed files. Server must be configured to serve them:
- **nginx:** `gzip_static on; brotli_static on;`
- **Express:** use `express-static-gzip`

---

## 7. Remaining Issues & Recommendations

### High Priority

| Issue | Lighthouse Finding | Recommendation |
|-------|-------------------|----------------|
| **Unminified JS** | Est. 1,694 KB savings | This is a dev server measurement — production build with Terser eliminates it entirely. Run `npm run build` for production. |
| **Unused JS** | Est. 870 KB savings | Mostly `react-router-dom` (87% unused) and `react-dom` (33% unused) — these are dev-mode bundles. Production build tree-shakes aggressively. |
| **LCP: 4.3s** | Element: `<p class="text-indigo-200">` in hero section | LCP is delayed by 1,530ms of element render delay. The dashboard data API call (`/artisan/dashboard-summary`) blocks rendering. Consider skeleton loading or streaming the hero section before data arrives. |
| **FCP: 2.1s** | Score: 0.25 | Caused by large JS parse time in dev mode. Production build reduces this significantly. |

### Medium Priority

| Issue | Lighthouse Finding | Recommendation |
|-------|-------------------|----------------|
| **bfcache blocked** | WebSocket prevents bfcache | Initialize WebSocket lazily (already done in `RealtimeNotifications` — only connects when `isAuthenticated`). Consider disconnecting on page hide: `document.addEventListener('visibilitychange', ...)` |
| **CLS: 0.056** | Footer shifts after load | Add `min-height` to the footer container or use `content-visibility: auto` to reserve space |
| **Button names** | 2 buttons in mobile header lack `aria-label` | Add `aria-label="Messages"` and `aria-label="Menu"` to the mobile header buttons in `RoleWorkspace.jsx` |
| **Color contrast** | 6 stat card labels fail 4.5:1 ratio | Change `text-slate-400` to `text-slate-500` on stat card titles (contrast ratio improves from 2.56 to 3.95) or use `text-slate-600` (5.74:1 — passes) |

### Low Priority

| Issue | Recommendation |
|-------|----------------|
| **Unminified CSS** | 5 KB savings — handled by production build |
| **Unused CSS** | 25 KB savings — Tailwind purge is already configured correctly; this is dev-mode measurement |
| **No CSP header** | Add `Content-Security-Policy` header in nginx/Express |
| **No HSTS** | Add `Strict-Transport-Security` header for production HTTPS |

---

## 8. Expected Scores — After Production Build

> Note: Lighthouse scores above were measured on the **Vite dev server** (unminified, no compression). Production build scores will be significantly higher.

| Metric | Dev Server (measured) | Production Build (estimated) |
|--------|----------------------|------------------------------|
| Performance | 64 | **85–92** |
| FCP | 2.1 s | **0.8–1.2 s** |
| LCP | 4.3 s | **1.5–2.5 s** |
| TBT | 20 ms | **< 50 ms** |
| CLS | 0.056 | **0.01–0.03** |
| Bundle (gzip) | 4,206 KB | **~350 KB initial** |

---

## 9. How to Verify

```bash
# Build for production
cd frontend
npm run build

# Preview production build locally
npm run preview

# Run Lighthouse against production preview (port 4173)
npx lighthouse http://localhost:4173/artisan --output=json --output-path=./lighthouse-prod.json
```

---

## 10. Files Modified

| File | Change |
|------|--------|
| `vite.config.js` | Added compression plugin, manual chunk splitting, fixed optimizeDeps |
| `src/pages/ArtisanSubscription.jsx` | Lazy-loaded Stripe SDK and Elements |
| `src/pages/ArtisanDashboard.jsx` | Parallel API calls, React.memo on sub-components |
| `src/components/DashboardTopbar.jsx` | Extracted LiveClock, removed setInterval from topbar |
| `src/components/NotificationBell.jsx` | Fixed token/navigate crash, added auth guards |
| `src/components/RealtimeNotifications.jsx` | Added React.memo |
| `src/i18n.js` | Async translation JSON loading |
| `index.html` | Added preconnect/dns-prefetch resource hints |
| `package.json` | Added `vite-plugin-compression2` dev dependency |
