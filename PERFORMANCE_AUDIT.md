# Performance audit

Audit date: 2026-09-16. Baseline commit: `6de1306` after pulling `origin/main`.

## Baseline

- Production build: 3.00 seconds; 3,317 transformed modules.
- Main application JavaScript: 1,158.47 kB minified / 323.67 kB gzip.
- Shared Lucide chunk: 843.22 kB minified / 154.37 kB gzip.
- CSS: 55.95 kB minified / 9.00 kB gzip.
- The initial route eagerly imported every application page.
- Authentication was initialized twice because `AuthProvider` wrapped the app in both `main.jsx` and `App.jsx`.
- There was no working test suite. The backend test script was an intentional failure and the client had no test command.
- The deployed Render root endpoint measured 22.400 s TTFB after idle and 0.311 s on the immediately repeated request. This is a hosting cold-start bottleneck, not JavaScript execution.

## Changes and measured result

- Route-level lazy loading reduced the main runtime to 279.65 kB minified / 92.18 kB gzip: **75.9% smaller minified and 71.5% smaller gzip**.
- Replacing whole-library dynamic icon imports removed the 844.80 kB Lucide chunk from the build.
- Socket.IO is loaded only for authenticated users, rather than blocking the login bundle.
- Production build time fell from 3.00 s to 2.4 s in the final verification run (machine-local and subject to normal variance).
- The local production shell returned in 7.4 ms and its entry chunk in 4.7 ms. A browser reload restored the visible login route in approximately 0.19 s.
- A service worker now serves the cached application shell and fingerprinted static assets on repeat visits. Vercel immutable cache headers cover hashed assets.
- The authenticated user profile is restored from session storage immediately, then validated in the background. A 401 clears persisted state.
- Stable reference requests are deduplicated and session-cached. Mutations and 401 responses invalidate cached API data.
- Dashboard duplicate order requests were removed, and the kitchen now reuses the shared socket instead of opening a second connection.
- Order creation menu lookups changed from N queries to one bulk query. Parcel creation changed from roughly 2N menu lookups to one bulk query.
- Independent list/count/statistics database operations now execute concurrently and read-only list queries use lean objects.
- Compound indexes were added for branch/status/date, kitchen queue, table, expense, and payment query shapes.
- API responses larger than 1 kB are compressed.

## Verification

- Client cache tests: 3 passing.
- Backend index tests: 3 passing.
- Production build: passing with no oversized-chunk warning.
- Changed backend modules: syntax checks passing.
- Browser smoke test: login route renders and reloads successfully from the production preview.
- Existing ESLint debt remains elsewhere in the application (unused code, hook dependency warnings, and Fast Refresh file-boundary warnings). It predates this work and does not block the production build, but should be cleaned up separately.

## Remaining bottlenecks and recommended follow-up

1. The Render service sleeps when idle; its measured 22.4-second cold start dominates a first uncached visit. Use an always-on instance or a platform without scale-to-zero for this API.
2. Authenticated, data-rich Core Web Vitals and database timings require production-like credentials/data and browser real-user monitoring. Add Web Vitals telemetry plus endpoint p50/p95/p99 timing before the next tuning pass.
3. Revenue charts remain intentionally isolated in a large on-demand route chunk. Consider a lighter charting library only if field telemetry shows that route is frequently used and slow.
4. Two unused 1024px public PNG files add about 1.56 MB to deployment artifacts, though they are not requested by the browser. Remove them after confirming no external URLs depend on them.
5. The dependency audit reports known vulnerabilities in the existing backend dependency tree. Upgrade them in a dedicated compatibility/security pass rather than using a breaking forced audit fix.
