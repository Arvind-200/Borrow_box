# BorrowBox

BorrowBox is a local peer-to-peer item borrowing and rental marketplace. A user
can list items they own and borrow items from nearby users in the same account.

Core flow: search for an item, open a listing, send a borrow request, and let the
owner accept or reject it. Completed borrows can be reviewed by the borrower, and
admins moderate users, listings, reviews, and reports from a separate admin
console.

## Features

- Public landing page, browse/search page, category pages, and product details
- Authentication with JWT stored in an HttpOnly cookie and bcrypt password hashing
- Listing management for owners: create, edit, publish/unpublish, delete, optional image upload
- Search and filters: text, category, location/area, price range, availability, sorting
- Borrow request lifecycle: Pending -> Accepted or Rejected, plus cancel and Completed
- Reviews and ratings after completed borrows
- Reports for prohibited items, scams, wrong information, offensive content, duplicates, and other reasons
- Admin console: dashboard, users, listings, requests, reports, reviews, categories, activity log, settings
- Responsive UI (desktop, tablet, mobile) with keyboard-accessible navigation

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 3 |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB (Atlas or local) |
| Auth | JWT (HttpOnly cookie), bcryptjs |
| Validation | Backend request validators; shared client-side form checks |

## Repository structure

```
BorrowBox/
  backend/              Express API, models, services, controllers, validators, tests, scripts
  frontend/             React app (pages, components, context, services, hooks)
  docs/                 Project state, phase plan, architecture, screenshots
  AGENTS.md             Working instructions for this repository
```

## Prerequisites

- Node.js 18 or newer (verified with Node 24)
- npm
- MongoDB Atlas cluster or a local MongoDB server
- For borrow accept/cancel/complete flows: a deployment that supports
  transactions (Atlas replica set or a local replica set)

## 1. Backend setup

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env`:

```ini
PORT=5000
NODE_ENV=development

# Include the database name. Without /borrowbox, MongoDB defaults to "test".
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/borrowbox?retryWrites=true&w=majority

# Local fallback (used when MONGODB_URI is empty)
MONGO_URI=mongodb://localhost:27017/borrowbox

# Required: non-default, at least 32 characters
JWT_SECRET=replace-with-a-long-random-secret

FRONTEND_URL=http://localhost:5173
```

Start the API:

```powershell
npm start
```

Health check: `http://localhost:5000/api/health`

Notes:

- `backend/.env` is git-ignored. Only placeholder values belong in `.env.example`.
- In production (`NODE_ENV=production`) the server refuses to start with a
  missing, short, example, or predictable `JWT_SECRET`.
- Uploaded images are stored under `backend/uploads/` (git-ignored) and served at
  `/uploads/...`.

## 2. Frontend setup

The frontend calls the backend through the Vite dev proxy (`/api` and `/uploads`),
so no frontend environment variables are required for local development.

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Production build:

```powershell
npm run build
```

The build output goes to `frontend/dist/` and is git-ignored.

## 3. Seed demo data

```powershell
cd backend
npm run seed
```

The seed is idempotent and upserts:

- 8 categories
- 8 demo listings owned by a non-loginable demo owner
- demo ratings reset to 0 (ratings only come from real reviews)

It deletes nothing. Existing conversations, requests, reviews, and user listings
are left untouched.

## 4. Create an admin account

Set the values only in the command environment (do not commit a real password):

```powershell
cd backend
$env:ADMIN_NAME="BorrowBox Admin"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="replace-with-a-strong-password"
npm run create:admin
```

The command is idempotent. If the email already exists, it promotes that account
to admin and reactivates a blocked account without changing the password.

## Demo login accounts

No passwords are committed to this repository.

| Account | Purpose | Login |
| --- | --- | --- |
| Admin created with `npm run create:admin` | Admin console at `/admin` | The password chosen when creating that account |
| `demo.owner@borrowbox.local` | Owns the 8 seeded demo listings | Cannot log in by design (random unused password) |
| Any account created through `/signup` | Borrower and/or lender | The email and password used at signup |

This local database currently contains `admin@borrowbox.local`, which was created
with `npm run create:admin`. Its password is not stored in the repo. Create a new
admin for a fresh demo, or reset that account's password in your own environment.

## Available scripts

Backend (`backend/package.json`):

| Script | Description |
| --- | --- |
| `npm start` | Start the API server |
| `npm run dev` | Start the API with Node watch mode |
| `npm run seed` | Idempotently upsert demo categories and listings |
| `npm run create:admin` | Create or promote an admin account |
| `npm test` | Run backend unit tests |
| `npm run test:integration` | Run API integration tests (requires `RUN_DB_TESTS=1`) |

Frontend (`frontend/package.json`):

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |

## API overview

All routes are prefixed with `/api`.

| Area | Endpoints |
| --- | --- |
| Health | `GET /health` |
| Auth | `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Public catalog | `GET /categories`, `GET /products`, `GET /products/locations`, `GET /products/:id` |
| Owner listings | `GET /products/mine`, `GET /products/mine/:id`, `POST /products`, `PUT /products/:id`, `PATCH /products/:id/publication`, `DELETE /products/:id`, `POST /products/images` |
| Borrow requests | `POST /borrow-requests`, `GET /borrow-requests/my`, `GET /borrow-requests/incoming`, `PATCH /borrow-requests/:id/accept`, `/reject`, `/cancel`, `/complete` |
| Reviews | `POST /reviews`, `GET /reviews/mine`, `GET /products/:id/reviews` |
| Reports | `POST /reports` |
| Admin | `/admin/dashboard`, `/admin/users`, `/admin/listings`, `/admin/requests`, `/admin/reports`, `/admin/reviews`, `/admin/categories`, `/admin/activity`, `/admin/settings` |

Error responses are JSON with a consistent `message` field. Protected endpoints
reject unauthenticated requests with `401`; admin endpoints also enforce the
admin role on the server with `403`.

## Testing

Backend unit tests (no database required):

```powershell
cd backend
npm test
```

Backend integration tests use a temporary MongoDB database derived from the
configured connection, and require transaction-capable MongoDB for the full
suite:

```powershell
cd backend
$env:RUN_DB_TESTS="1"
npm run test:integration
```

Frontend:

```powershell
cd frontend
npm run build
```

There is no frontend unit-test or lint script configured in this project.

## Screenshots

Screenshots captured from the running app are in `docs/screenshots/`:

- `landing-hero.png`, `browse.png`, `product-detail.png`, `login.png`
- `admin-dashboard.png`, `admin-listings.png`, `admin-users.png`,
  `admin-requests.png`, `admin-reports.png`, `admin-reviews.png`,
  `admin-categories.png`, `admin-activity.png`, `admin-settings.png`
- `mobile-landing.png`, `mobile-browse.png`, `admin-mobile-menu.png`

The admin screenshots were captured with a temporary admin account that was
deleted after the QA run.

## Deploy free (Render + MongoDB Atlas)

The app is designed to run as a single Render free web service: Express serves
both the API and the built React app. One origin keeps the HttpOnly login cookie
working without cross-site cookie changes. MongoDB Atlas M0 hosts the database.

1. In Atlas, use a database user with read/write access and allow Render's
   dynamic outbound traffic (`0.0.0.0/0` under Network Access for a free demo).
   Copy the connection string and include the database name, for example
   `/borrowbox`. The same database name must be used locally and on Render.
2. In Render, choose **New > Blueprint** so `render.yaml` is used, or create a
   web service manually with:
   - Build command:
     `npm ci --prefix backend && npm ci --prefix frontend --include=dev && npm run build --prefix frontend`
   - Start command: `npm start --prefix backend`
   - Plan: Free
3. Set the environment variables in Render:
   - `NODE_ENV=production`
   - `MONGODB_URI=<Atlas URI including the database name>`
   - `JWT_SECRET=<random secret of at least 32 characters>`
   - `FRONTEND_URL=https://<your-service>.onrender.com`
4. Deploy and check `https://<your-service>.onrender.com/api/health`.
5. Free Render services have no shell, so run seed and admin bootstrap from your
   machine against the same Atlas database:

   ```powershell
   cd backend
   npm run seed
   $env:ADMIN_NAME="BorrowBox Admin"
   $env:ADMIN_EMAIL="admin@example.com"
   $env:ADMIN_PASSWORD="replace-with-a-strong-password"
   npm run create:admin
   ```

6. Open the deployed URL, sign up, browse, and log in to `/admin`.

Free-tier notes:

- The service sleeps after 15 minutes without traffic and wakes in about a
  minute on the next request.
- The filesystem is ephemeral, so uploaded images are lost when the service
  restarts, redeploys, or sleeps. Listings fall back to category graphics.
- Atlas M0 is limited to 512 MB and pauses after 30 days with no connections.
- Never commit real credentials; set them only in Render's environment settings.

## Security notes

- `.env` files and `backend/uploads/` are git-ignored; do not commit secrets.
- JWTs are delivered in HttpOnly cookies; the frontend does not store tokens in
  localStorage.
- Helmet security headers are enabled, `x-powered-by` is disabled, and auth
  endpoints are rate limited.
- Admin permissions are enforced by backend middleware, not only by the UI.
- Moderation and listing ownership checks are enforced server-side.

## Known limits

- No payments, real maps, live chat, or identity verification.
- Nearby-area suggestions are intentionally empty until verified mappings are added.
- The listing form supports one primary image (the model allows up to 8).
- Frontend dependency audit still reports vulnerabilities in Vite/esbuild and
  React Router that require major upgrades; no forced upgrade was performed.
- Responsive QA was performed with headless Chrome at 390, 768, and 1440 px.
  Screen-reader testing was not performed.

## Troubleshooting

- **MongoDB connection fails**: confirm the URI, network access, and that the
  password is URL-encoded. The URI must contain the database name (for example
  `/borrowbox`); otherwise MongoDB uses the default `test` database.
- **Accept/cancel returns 503**: the connected MongoDB deployment does not
  support transactions. Use Atlas or a local replica set.
- **Frontend cannot reach the API**: confirm the backend is running on port 5000
  and that `vite.config.js` proxies `/api` to it.
- **Login fails for the seeded demo owner**: that account is intentionally not
  loginable. Create your own account with `/signup`.
