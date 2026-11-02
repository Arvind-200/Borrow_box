# BorrowBox Audit Remediation

Date: 2026-10-27

## Source of findings
No standalone Project Audit Report was present in the repository. The only related file found was `.opencode/commands/audit.md`, which is an audit command template, not a report. Remediation followed the priority list supplied in the task.

## Backend changes
- Added `helmet` globally and disabled the `x-powered-by` header.
- Added `express-rate-limit` to authentication:
  - Signup: 5 attempts per IP per hour.
  - Login: 10 failed attempts per IP per 15 minutes; successful requests are not counted.
  - Blocked requests return HTTP 429 with a consistent JSON error.
- Added production JWT configuration validation. With `NODE_ENV=production`, startup now fails before the database connection when `JWT_SECRET` is missing, shorter than 32 characters, a known example/default value, or a clearly predictable repeated/low-variety value. This is a conservative pattern check, not a claim to measure cryptographic entropy.
- Patched vulnerable backend dependencies without force or major upgrades:
  - `body-parser` updated to `1.20.9`.
  - `qs` updated through `npm audit fix`.
  - Added `helmet@8.3.0` and `express-rate-limit@8.7.1`.
- Added Node built-in tests for configuration validation, password bounds, security headers, and auth rate limits.

## Frontend changes
- Signup password validation now matches the backend: 8 to 128 characters.
- Login no longer imposes the old 6-character minimum; the backend remains authoritative.
- Removed nonfunctional account UI: remember-me checkbox and forgot-password link.
- Removed links to nonexistent legal, support, safety, and social pages, plus the placeholder social links.
- Removed fake trust badges and claims about verified profiles, ratings and reviews, community guidelines, and 24/7 reporting/safety support.
- Replaced misleading claims with explicit current status: browsing and owner listing management are available; borrow requests, reviews, reporting, and admin tools are planned.
- Removed product rating/review display until reviews exist.
- Changed borrow-request CTAs to state that requests are coming soon instead of implying an active request flow.
- Removed the nonfunctional location selector and unused mock data containing fake distances and auto-detection claims.
- Corrected category, listing, About, login, signup, product form, and My Products copy that implied borrowing or proximity features were already live, including location-neutral category page copy.
- No product or authentication API contracts were intentionally changed. No new frontend dependency was added.

## Verification run
- Backend: `npm test` passed 13/13 tests after the final test and dependency updates.
- Backend: `node --check` passed for all files under `src`, `scripts`, and `test`.
- Backend: production startup exited with code 1 and a clear validation error before connecting to MongoDB for missing, short, exact example, and repeated/low-variety `JWT_SECRET` values. The candidate secret was not printed.
  - A first manual attempt with an empty `JWT_SECRET` environment variable loaded `.env` and reached the configured database before the process was terminated. No writes were issued, and the process left port 5000 free.
- Backend: `npm audit` reported 0 vulnerabilities.
- Frontend: `npm run build` passed after the final copy edits (66 modules).
- Frontend: `npm audit fix` updated `postcss-selector-parser` to `6.1.5`; no force or major upgrades were applied.

## Unresolved audit items
- Frontend `npm audit` still reports 4 vulnerabilities (3 moderate, 1 high): Vite/esbuild and React Router.
  - Vite requires a major upgrade to `8.3.5` or later.
  - `react-router-dom` requires a major upgrade to `7.18.4` or later.
  - `npm audit fix --force` was deliberately not run. These upgrades need a separate compatibility pass.
- No browser or manual responsive UI pass was run after these changes.
- Borrow requests, returns, reviews, reports, and admin tools remain unimplemented.
- Location/proximity search remains unimplemented. The UI no longer presents a fake location selector.
- Auth rate-limit storage is in-memory, so limits are per running process. A shared store is needed before multi-instance production deployment.
- Production proxy deployment will require deliberate trust-proxy configuration for correct client-IP rate limiting; it was not enabled here.

## Operational note
`JWT_SECRET` must be set to a strong, non-predictable value of at least 32 characters in production. Do not commit real environment values.
