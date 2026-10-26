# BorrowBox Project State

> This file is the project's short-term memory.
> Update it after completing a feature. Do not record guesses.

## Project
BorrowBox - local peer-to-peer item borrowing/rental platform.

## Current status
Phase: 4B - Public Catalog Frontend Integration ✓
Completed:
- Product concept defined
- Borrower/lender workflow defined
- Admin requirements defined
- React + Node.js + MongoDB stack selected
- OpenCode workflow selected
- Frontend: React + Vite + Tailwind CSS + React Router
- Backend: Node.js + Express + Mongoose
- MongoDB local connection established
- GET /api/health endpoint working
- Atlas DB prep (verified): backend reads MONGODB_URI first (MONGO_URI fallback, local default mongodb://localhost:27017/borrowbox); existing Mongoose connection module reused unchanged (logs host only, errors report message only, no URI/password printed); backend/.env is git-ignored and .env.example holds placeholders only with a /borrowbox Atlas template; live `npm start` connects successfully; no hardcoded credentials in backend source; authentication was added later in Phase 3
- Reusable UI components: Button, Input, Card, Modal, LoadingSpinner, Toast
- Layout components: Navbar, Footer
- Pages: Landing, Browse, Categories, Login, Signup, My Products (placeholder), About (placeholder), 404
- Environment configuration with .env.example files
- Vite proxy configured for API calls
- Design tokens: colors (primary, secondary, success, warning, error, neutral), typography (Inter + Plus Jakarta Sans), spacing, border radius, shadows
- Global base styles: font imports, CSS variables, focus-visible, scrollbar, selection
- Utility classes: .container-page, .section-padding, .btn-*, .input-field, .card-elevated, .text-gradient, animations
- Responsive Navbar: logo, prominent search bar, location selector, nav links, auth buttons
- Mobile: hamburger menu with slide panel (search, location, nav links, auth)
- SearchBar: autocomplete suggestions (categories + recent), keyboard navigation
- LocationSelector: mock areas (Your Area, Nearby, 2.3 km away, etc.)
- Enhanced Footer: trust badges (Verified Profiles, Ratings & Reviews, Community Guidelines, Reporting & Safety), locale/currency selectors
- ProductCard: premium 4:3 card with branded placeholder, hover zoom, category pill, ₹ price/day, star rating, review count, location/distance, availability badge, View Details CTA, visual save button
- ProductCardSkeleton: matching skeleton loader with pulse animation
- ProductGrid: responsive grid (1/2/4 columns) with loading and empty states
- StarRating: accessible 1-5 stars with decimal support, optional rating/count display
- Badge: reusable badge with variants (default, primary, success, warning, danger, info, outline, subtle) and sizes
- CategoryCard: gradient cards with custom SVG icons, item counts, hover effects (contrast improved: primary-600/70 text, primary-800 names, primary-100/30 icon backgrounds for readability)
- Mock data: 8 realistic products (Camera, Drill, Speaker, Projector, Console, Tent, Bicycle, Hammer) and 8 categories with gradients
- Phase 2D: Premium Homepage - enhanced LandingPage with 7 sections: Hero, Categories, Popular Items, How It Works, Trust & Safety, Local Borrowing benefits, Final CTA
- UI redesign (verified): emerald (#10B981) + navy (#172033) + canvas (#F8FAFC) design system in Tailwind theme and global styles; dark navy Navbar with category selector + required search placeholder + Browse/List/Login/Signup + mobile drawer; multi-column Footer (Borrow/Lend/Support/Legal + trust badges + copyright); white high-contrast CategoryCards; polished ProductCards (valid gradient fallbacks, wishlist, rating, location, price, View Details); consistent Login/Signup with password visibility toggle; `npm run build` passes
- Phase 2E (verified): real /browse page (heading, description, live result count, search box, category/location/price filters, Recommended + price low-high + price high-low sort, sticky desktop sidebar on xl+, collapsible filter panel with active-count badge below xl, removable active-filter chips + Clear all, custom empty state with clear-filters action, filters synced to URL params q/category/location/min/max/sort); real /categories page reusing CategoryCard (clicks open /browse with that category preselected); card taps and wishlist taps lead to /login per logged-out protected-action rules; no backend/auth/API changes, no new packages; `npm run build` passes (57 modules). Limits: mock data has no descriptions (search covers title/category/location/tags), no dates (no Newest sort), all listings Available (no availability filter), no product detail pages yet, results filter instantly (no artificial loading delay)
- Phase 2F (verified): homepage product cards/wishlist now follow the logged-out login rule (no more silent no-ops); footer How It Works links point to the homepage #how-it-works section with anchor + smooth hash scrolling; SearchBar ids unique per instance (duplicate-id a11y fix); removed duplicated category label on ProductCard; global prefers-reduced-motion support in CSS; navbar/drawer/footer/landing/browse/categories/auth/placeholder pages audited for overflow, spacing, active states, and contrast — no layout rewrites needed; `npm run build` passes (57 modules, no test/lint scripts exist in the project). Remaining limits: /help, /contact, /guidelines, /safety, /privacy, /terms, /cookies, /forgot-password have no pages yet and render the honest 404 page (building them is out of scope); no product detail pages; login/signup were wired to the API later in Phase 3; manual browser pass at mobile/tablet/desktop widths still recommended
- Phase 4A (verified): Product & Category backend foundation. Added Category and Product Mongoose models with validation, indexes, and User/Category relationships; public read APIs GET /api/categories, GET /api/products, and GET /api/products/:id; product listing supports q search, category filter by slug or ObjectId, minPrice/maxPrice (min/max aliases), sort (recommended, price-asc, price-desc, newest), page, and limit; responses use consistent { products, pagination } / { product } / { categories, count } JSON and ApiError 400/404 errors; product responses expose only public owner id/name and never passwordHash, email, role, or status. Added idempotent seed script `npm run seed` (upserts 8 categories + 8 demo products by slug/seedKey, creates one non-loginable demo owner, deletes nothing). Verified against the configured MongoDB: ran seed twice with no duplicates (8 categories, 8 products, 1 demo owner), tested search/filter/sort/pagination, product detail, invalid/missing IDs, unknown category, bad sort, invalid price range, invalid page/limit, and duplicate query params; 22 backend JS files passed `node --check`.
- Phase 4B (verified): frontend catalog now uses the Phase 4A APIs. Added `api.getCategories`, `api.getProducts`, and `api.getProduct`; landing page uses API categories/products with loading, error/retry, and empty states; browse page uses API-backed q/category/min/max/sort/page with URL sync, active-filter chips, clear-all, mobile filter panel, pagination (6 per page), and error/empty/retry states; categories page uses API category data. Added public `/products/:id` detail page with breadcrumbs, image fallback, category/availability/condition badges, rating, owner, price, description, tags, and listing metadata. SearchBar now provides debounced API suggestions with mouse and keyboard navigation to products/categories. Product cards use the API product shape and navigate to detail pages. Guest "Log in to request" redirects to `/login` with a safe return path; authenticated users see an honest "Borrow requests are coming soon" toast until the request flow exists. "List an Item" links now target `/my-products`, and the My Products creation CTA shows a coming-soon toast instead of fake navigation. Verified: `npm run build` passes (67 modules); landing/browse/detail have no horizontal scroll at 360, 390, 500, 768, 1024, and 1440px widths; desktop and 390px screenshots visually checked; live checks passed for search suggestion click and keyboard selection, category filter, price sort, clear filters, pagination next/previous, guest redirects from product detail and `/my-products`, and API-blocked error/retry recovery. Limits: product create/edit/delete, image upload, borrow request creation, location relevance, reviews, reports, and admin remain future phases; no test or lint scripts exist.

Completed:
- Phase 3 Step 3 - Frontend auth integration (API utility, AuthContext, ProtectedRoute, Navbar/mobile auth state, Login/Signup page integration, verification via HTTP proxy)
  - frontend/src/services/api.js: fetch wrapper with credentials:'include', safe error handling, network-failure resilience
  - frontend/src/context/AuthContext.jsx: AuthProvider with loading/authenticated/unauthenticated states, login/signup/logout/refresh/refresh methods, startup GET /api/auth/me, duplicate-request guard
  - frontend/src/components/ProtectedRoute.jsx: Navigate to /login when unauthenticated
  - frontend/src/main.jsx: AuthProvider + ToastProvider wrapper around React root
  - frontend/src/pages/LoginPage.jsx: real submit via API utility, email prefill on failure, error toast, safe redirect
  - frontend/src/pages/SignupPage.jsx: success → login redirect with email prefill, success toast
  - frontend/src/components/layout/Navbar.jsx: auth-aware: loading spinner → user name + Logout when authenticated; Login/Signup when logged out
  - frontend/src/components/layout/MobileNavPanel.jsx: auth-aware drawer state mirroring Navbar
  - frontend/src/components/ui/Toast.jsx: fixed bare-JSX attribute mt-0.5 parse error (moved into className template)
  - frontend/src/components/layout/Navbar.jsx: logout confirmation modal using ConfirmDialog with "Are you sure you want to log out?" message, Cancel and Yes, Logout buttons; Cancel keeps user authenticated; Yes, Logout calls POST /api/auth/logout, clears session state, and navigates to /; duplicate requests prevented with isLoggingOut flag
  - frontend/src/components/layout/MobileNavPanel.jsx: logout confirmation modal using ConfirmDialog, same behavior from mobile navigation drawer
  - frontend/src/context/AuthContext.jsx: browser Back/Forward protection; useEffect listens for pageshow event with event.persisted; on b/f cache restoration, api.me() revalidates session; if unauthenticated, ProtectedRoute redirects to /login; public pages remain accessible; no JWTs stored in browser storage
  - Frontend production build: 63 modules (was 62), passes without error
  - HTTP integration via Vite proxy (/api → localhost:5000): 13/13 checks passed (signup 201, duplicate 409, invalid input 400, login 200 with cookie, me public fields only, wrong password generic 401, logout clears cookie, me after logout 401, public routes render while logged out)
  - Logout redirect fix: added missing `const navigate = useNavigate()` to Navbar.jsx and MobileNavPanel.jsx (both imported useNavigate but never invoked it, so navigate('/') threw ReferenceError after logout); logout now redirects to / correctly; `npm run build` passes (63 modules)

In progress:
- Phase 4B complete (verified); owner listing management has not been implemented

Next recommended phase:
- Phase 4C - Owner listing management (authenticated create/edit/unpublish APIs and UI; server-side ownership checks)

## Core user workflow
1. Visitor opens landing page.
2. Default products are visible.
3. Visitor can browse/search, but protected actions require login.
4. User searches for an item such as "drill machine".
5. Results prioritize relevant/nearby listings.
6. User opens a product detail page.
7. User reviews image, description, rating, reviews, rent, owner and location.
8. User sends a borrow request.
9. Owner receives the request.
10. Owner accepts or rejects.
11. Borrower sees Accepted or Rejected.

## Core roles
- User: can borrow and list items.
- Admin: manages moderation and platform operations.

## MVP entities
- User
- Product
- Category
- BorrowRequest
- Review
- Report
- AdminActivityLog

## Important product rules
- A user may own and borrow products.
- Admin routes require backend authorization.
- Product ownership must be checked server-side.
- A user must not approve their own borrow request.
- A blocked user cannot perform normal marketplace actions.
- Product moderation status must be respected by public search/results.

## Decisions
- React + Tailwind CSS frontend
- Node.js + Express backend (plain JavaScript)
- MongoDB database
- JWT authentication
- Local MongoDB for development first
- REST API
- Premium marketplace UI
- Build in small verified phases

## Do not assume
- Exact payment provider
- Exact map provider
- Production hosting
- Real-money payment implementation
- Real-time chat
- Identity/KYC provider

## Change log
- Initial state created.
- Phase 1 completed: Foundation setup (frontend, backend, MongoDB, routing, UI primitives, health check)
- Phase 2A completed: Design Foundation (extended Tailwind config with design tokens, global base styles, CSS variables, utility classes)
- Phase 2B completed: Navbar, Search & Layout (responsive navbar with search/location, mobile panel, enhanced footer with trust badges)
- Phase 2C completed: Product & Category Components (ProductCard, ProductCardSkeleton, ProductGrid, CategoryCard, StarRating, Badge, mock data)
- UI redesign completed: premium emerald/navy marketplace theme, Navbar + Footer + Homepage + cards + auth pages polished, build verified (no backend/auth changes, no new packages)
- Navbar refinement verified: logo far left; category dropdown and Browse Items action removed (Browse route, homepage CTA, and drawer links untouched); wider centered desktop search; larger Log in / emerald Sign up at far right; larger Home / Categories / How It Works links with Location selector in secondary row; dark navy + emerald kept; mobile drawer + search preserved; `npm run build` passes
- Animated LocationSelector verified: 44x44 icon-only collapsed state, expands to full selector on hover/focus/dropdown-open with ~300ms transition, collapses on mouse leave without changing selection, tap-to-open on touch, keyboard + reduced-motion supported, existing mock locations and selection behavior reused; `npm run build` passes
- Phase 2E completed: Browse Items page + Categories page (functional client-side search/filters/sort on mock data, URL-synced params, empty state, mobile filter panel)
- Final navbar refinement verified: top row keeps logo far left, wide centered search (required placeholder), larger Log in + emerald Sign up far right (List an Item retained); navigation row is Home, Browse Items, Categories, My Products, About Us + animated location selector with balanced spacing and hover/active states; no All-Categories dropdown and no top-row Browse Items action; homepage Browse CTA untouched; My Products (/my-products) and About Us (/about) are small honest placeholder pages (no auth state or listing backend exists, so My Products directs visitors to the Login/Signup flow per protected-action rules); mobile drawer includes all five links + search + location + auth; Contact Us stays footer-only; `npm run build` passes (55 modules)
- Phase 2E verified: /browse + /categories pages live, all existing browse links resolve, card/wishlist taps follow logged-out login rule; `npm run build` passes (57 modules)
- Phase 2F verified: silent homepage card actions fixed, /how-it-works footer links land on the homepage section, SearchBar id duplication fixed, ProductCard category duplication removed, reduced-motion support added; `npm run build` passes (57 modules, no test/lint scripts in project)
- Navbar search fix verified: SearchBar suggestions are now built live from mock data — typing a product name ("drill", "camera", "tent", "speaker") shows matching products (name/tags/category/location, case-insensitive partial match) plus matching categories; Enter or a product suggestion navigates to /browse?q=... (applied as product-text search, never converted to a category filter); category suggestions navigate to /browse?category=<id>; BrowsePage needed no changes; `npm run build` passes
- Phase 3 Step 1 completed (verified): User model (name/email/passwordHash/role/status, timestamps, unique lowercase email), bcryptjs password hashing util (cost 12, length 8-128, no plaintext logging), POST /api/auth/signup (server validation, duplicate-email 409 incl. Mongo 11000 race handling, role:admin forced to user, 201 with public-fields-only JSON); live curl tests against Atlas passed (valid 201, missing fields 400, invalid email 400, short password 400, duplicate 409, admin-role forced to user); DB document confirmed to contain bcrypt hash ($2 prefix), never plaintext; all 3 test users deleted after testing; health endpoint unaffected
- Phase 3 Step 2 completed (verified): POST /api/auth/login (generic 401 for unknown email AND wrong password, blocked account 403 with no cookie set, bcrypt verify via utils/password.js), JWT in HttpOnly cookie `token` (sameSite=lax, secure only when NODE_ENV=production, Max-Age=604800 = 7d matching JWT exp, Path=/, cleared identically on logout), POST /api/auth/logout (idempotent, clears cookie), GET /api/auth/me via requireAuth middleware (cookie-only, verifies signature+expiry, loads user from MongoDB so role/status come from DB not token, 401 for missing/tampered/expired token, 403 blocked, public-fields-only JSON); 27/27 automated HTTP checks passed against Atlas (incl. tampered + pre-signed expired token, blocked account, logout-clears-cookie, no token in any JSON response); JWT_SECRET fallback removed from env.js (fails safe 500 if unset); server log confirmed free of real passwords/JWTs; all test users cleaned up; server stopped; frontend `npm run build` passes; cookie-parser + jsonwebtoken added
- Phase 3 Step 3 completed (verified): frontend auth integration (API utility, AuthContext, ProtectedRoute, Navbar/mobile auth state, Login/Signup page integration). API utility uses credentials:'include' through Vite proxy; AuthContext provides loading/authenticated/unauthenticated states and login/signup/logout/refresh with safe error handling; ProtectedRoute redirects unauthenticated to /login; Navbar/MobileNavPanel reflect auth state; Login/Signup pages submit via API with backend contract; HTTP proxy integration: 13/13 checks passed (signup 201, duplicate 409, invalid input 400, login 200 with cookie, me public fields only, wrong password generic 401, logout clears cookie, me after logout 401, public routes render while logged out). Toast.jsx bare-JSX attribute fix; build 62 modules; all test users cleaned up; no backend changes needed.
- Logout confirmation modal implemented: ConfirmDialog reused in Navbar and MobileNavPanel; "Are you sure you want to log out?" modal with Cancel and Yes, Logout buttons; Cancel keeps user authenticated; Yes, Logout calls POST /api/auth/logout, clears session state, and navigates to /; duplicate requests prevented with isLoggingOut flag; same behavior from both desktop and mobile navigation.
- Browser Back/Forward protection after logout: useEffect added in AuthProvider listening for pageshow event with event.persisted; on back/forward cache restoration, api.me() revalidates session; if unauthenticated, state updates to unauthenticated and ProtectedRoute redirects to /login; public pages remain accessible; no JWTs stored in browser storage; backend APIs still reject unauthenticated requests; Phase 3 Step 3 complete (frontend verified).
- Logout defect fixed (verified by build): Navbar.jsx and MobileNavPanel.jsx invoked navigate('/') without ever calling useNavigate(), so confirming logout cleared the session (POST /api/auth/logout, setUser(null), setStatus('unauthenticated')) and then threw ReferenceError: navigate is not defined; the try/catch showed a "Log out failed" error toast and the user was not redirected to /. Added the missing `const navigate = useNavigate()` to both components; logout now clears the session, shows the success toast, and redirects to / as designed; `npm run build` passes (63 modules). No error boundary exists in the app, but no render-time crash was found (all auth consumers use optional chaining on user); the literal white-screen symptom was not reproducible statically and remains NOT VERIFIED without a running backend + browser (requires Atlas connectivity).
- List an Item button visibility: LandingPage hero and Navbar (desktop + mobile) now hide the "List an Item" CTA when the user is logged out and show it only when authenticated. Logged-out visitors see Login/Sign up; logged-in users see List an Item. `npm run build` passes (63 modules).
- My Products page now consumes AuthContext: shows LoadingSpinner while auth initializes, renders an authenticated "No products yet" empty state with a "+ List a Product" primary CTA and "Browse Items" secondary CTA when logged in with no listings, and keeps the guest "Sign in to manage your items" card only as an unreachable fallback (ProtectedRoute redirects guests to /login). `npm run build` passes (63 modules).
- About Us page now consumes AuthContext: the "Create Free Account" CTA is hidden when authenticated and only shown for logged-out guests; "Browse Items" remains visible in both states. `npm run build` passes (63 modules).
- New BorrowBox brand logo implemented: reusable `Logo.jsx` component in `frontend/src/components/ui/Logo.jsx` with `size` (sm/md/lg), `showTagline`, and `variant` (light/dark) props. SVG logo mark (circular exchange arrows in #10B981/#34D399 + isometric box in #172033/#10B981/#34D399) with "Borrow" (#172033) + "Box" (#10B981) wordmark. Integrated into Navbar (desktop + mobile drawer), Footer (with tagline), LoginPage, and SignupPage. Added `frontend/public/favicon.svg` and updated `frontend/index.html` title to "BorrowBox — Peer-to-Peer Item Borrowing Marketplace". `npm run build` passes (64 modules).
- Phase 4A completed (verified): Category + Product models, public category/product read APIs, search/filter/sort/pagination, product detail, consistent 400/404 errors, and idempotent demo seed (`npm run seed`). Seed ran twice without duplicates. Verified against the configured MongoDB: categories=8, products=8, demo owners=1; API detail response contains no passwordHash/email. Backend syntax check passed for all 22 JS files.
- Phase 4B completed (verified): landing, browse, categories, search suggestions, and product cards now use the real catalog APIs; added the public product detail page and pagination; guest protected actions route to login with return paths; My Products no longer fakes listing creation. Verified responsive widths 360-1440px with no horizontal overflow, key search/filter/sort/pagination/auth/retry interactions, and a production build (67 modules). Phase 4C owner listing management is next.