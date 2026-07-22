# Task Management System

A full-stack Task Management System built for the Koncepthive Full Stack Web Developer
Intern technical assessment. Users authenticate with a single seeded account and manage
their daily tasks: create, view, update, delete, search, filter, and sort.

## Project Overview

The app has two parts:

- **`backend/`** — a REST API built with Express.js and MySQL. Handles authentication
  (short-lived JWT access tokens + rotating httpOnly-cookie refresh tokens) and full
  CRUD for tasks, plus search/filter/sort/pagination and a dashboard-stats endpoint.
- **`frontend/`** — a React.js single-page app (built with Vite) that consumes the API:
  login screen, dashboard with task counters, and a paginated task list with
  search/filter/sort and create/edit/delete.

**Design:** a light, white-based UI with a green accent color throughout (no dark
mode) — buttons, links, active nav states, and focus rings all use the green palette
defined in `frontend/tailwind.config.js`.

Note on the existing project I uploaded: it was a Next.js + Laravel/PHP app for a
different domain (accounts/transactions), so it wasn't reusable at the code level given
the required stack (React.js + Express.js + MySQL). I reused its visual language
(card/sidebar/dashboard layout, badge styles) to keep a consistent look, but all
application code here is freshly written against this brief.

### Bonus features implemented

- **Pagination** — the task list is server-side paginated (`page`/`limit` query params).
- **Refresh Token Authentication** — short-lived (15m) JWT access tokens plus rotating,
  revocable refresh tokens stored server-side and delivered via an httpOnly cookie.
- **Docker Support** — `docker-compose.yml` spins up MySQL, the backend, and the
  frontend together.
- **CI/CD** — GitHub Actions run automated tests on every push/PR and deploy to Vercel
  on merge to `main` (see "CI/CD & Deployment" below).
- **Unit/Integration Tests** — a Jest + Supertest suite covers auth (login, refresh
  rotation, logout), task CRUD, search/filter/sort/pagination, and bulk operations
  against a real, isolated MySQL test database.
- **Loading Indicators** and **Toast Notifications** — skeleton loaders and toast popups
  throughout the UI.

### Extra functionality beyond the brief

- **Kanban board view** — a List/Board toggle on the Tasks page; the board groups tasks
  into Pending / In Progress / Completed columns with native drag-and-drop to change a
  task's status (optimistic UI update, reconciled with the server).
- **Bulk actions** — multi-select checkboxes in the list view plus a floating action bar
  to mark several tasks as Pending/In Progress/Completed or delete them all in one
  request (`PATCH /api/tasks/bulk/status`, `DELETE /api/tasks/bulk`).
- **Dashboard charts** — a status breakdown (donut) and priority breakdown (bar chart)
  built with Recharts, backed by a single aggregated stats query (no extra round trips).
- **API hardening** — `express-rate-limit` on `/api/auth/login` (10 attempts / 15 min per
  IP) and on the API as a whole (120 req/min per IP), plus `compression` for gzip'd
  responses.

## Technology Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React.js (Vite), React Router, Tailwind CSS, Axios, lucide-react |
| Backend   | Node.js, Express.js |
| Database  | MySQL |
| Auth      | JWT (jsonwebtoken + bcryptjs) |
| Validation| express-validator (backend), inline validation (frontend) |

## Project Structure

```
project/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint/build/DB-smoke-test on every push & PR
│       └── deploy.yml             # Deploy to Vercel on push to main
├── backend/
│   ├── api/
│   │   └── index.js               # Vercel serverless entry point (exports the Express app)
│   ├── src/
│   │   ├── config/db.js          # MySQL connection pool
│   │   ├── controllers/          # Route handlers
│   │   ├── middleware/           # auth, validation, error handling, rate limiting
│   │   ├── models/                # Raw SQL query layer
│   │   ├── routes/                # /api/auth, /api/tasks
│   │   ├── validators/            # express-validator chains
│   │   ├── utils/                 # ApiError, asyncHandler, jwt helpers
│   │   ├── app.js
│   │   └── server.js              # Entry point for local/Docker/Render/Railway (not Vercel)
│   ├── tests/                      # Jest + Supertest suite (auth, tasks, bulk ops)
│   ├── database/
│   │   ├── schema.sql             # CREATE TABLE + seed data
│   │   └── seed.js                # optional Node-based reseed script
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── vercel.json                 # Vercel serverless routing config
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # Axios instance + endpoints (incl. bulk ops)
│   │   ├── components/            # Sidebar, TaskFormModal, Toolbar, Pagination,
│   │   │                          # KanbanBoard, BulkActionBar, etc.
│   │   ├── context/                # AuthContext, ToastContext
│   │   ├── pages/                  # Login, Dashboard (with charts), Tasks (list + board)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vercel.json                 # SPA rewrite rules for Vercel
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
├── docker-compose.yml
├── .env.docker.example
└── README.md
```

## Installation Instructions

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.x (or MariaDB 10.11+, which was used to test this project)

### 1. Clone / unzip and install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Environment Variables

Copy the example env files and fill in your own values.

**backend/.env** (copy from `backend/.env.example`):

```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_management
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=replace_this_with_a_long_random_secret_string
ACCESS_TOKEN_EXPIRES_IN=15m

JWT_REFRESH_SECRET=replace_this_with_a_different_long_random_secret_string
REFRESH_TOKEN_EXPIRES_IN=7d

# 'lax' for local/Docker dev (frontend+backend share a site, different ports).
# 'none' when deployed to Vercel (frontend/backend on different domains — requires HTTPS).
COOKIE_SAME_SITE=lax

DEFAULT_USER_NAME=Admin User
DEFAULT_USER_EMAIL=admin@test.com
DEFAULT_USER_PASSWORD=123456
```

**frontend/.env** (copy from `frontend/.env.example`):

```
VITE_API_BASE_URL=http://localhost:5000/api
```

> Note: `mysql2` connects over TCP even when `DB_HOST=localhost`. If your MySQL root
> user only allows `auth_socket`/`unix_socket` login, either set a password for root
> (`ALTER USER 'root'@'localhost' IDENTIFIED BY 'yourpassword';`) or create a dedicated
> app user, e.g.:
> ```sql
> CREATE USER 'taskapp'@'%' IDENTIFIED BY 'taskapp_pass';
> GRANT ALL PRIVILEGES ON task_management.* TO 'taskapp'@'%';
> FLUSH PRIVILEGES;
> ```
> and point `DB_USER`/`DB_PASSWORD` at that account.

## Database Setup

Run the schema script once against your MySQL server. It creates the `task_management`
database, the `users` and `tasks` tables, and seeds the required default account plus a
few sample tasks.

```bash
mysql -u root -p < backend/database/schema.sql
```

This seeds:

- **Email:** `admin@test.com`
- **Password:** `123456`

If you ever want to reset/reseed the demo data without re-running the full schema file,
there's also a Node script (reads the same `.env`):

```bash
cd backend
npm run seed
```

## Running the Backend

```bash
cd backend
npm install
cp .env.example .env   # then edit DB credentials / JWT secret
npm run dev             # nodemon, auto-restarts on changes
# or: npm start
```

The API starts on `http://localhost:5000` by default. Check `GET /api/health` to
confirm it's up and connected to MySQL.

## Running the Frontend

```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm run dev
```

The app starts on `http://localhost:5173`. Log in with `admin@test.com` / `123456`.

To build for production: `npm run build` (outputs to `frontend/dist`).

## Running Tests

The backend has a Jest + Supertest suite that spins up an isolated `task_management_test`
database (created and dropped automatically — it never touches your dev data), boots the
real Express app in-process, and exercises the actual HTTP layer end to end.

```bash
cd backend
npm install
npm test
```

By default it connects using the same `DB_HOST`/`DB_USER`/`DB_PASSWORD` conventions as
`.env.example` (root user, no password, localhost:3306); override with env vars if your
local MySQL is configured differently, e.g.:

```bash
DB_USER=root DB_PASSWORD=yourpassword npm test
```

Covers: login validation/success/failure, the full access+refresh token rotation
lifecycle (including that logout actually invalidates the session), task CRUD, combined
search/filter/sort, pagination metadata, and both bulk endpoints.

## API Documentation

All endpoints are prefixed with `/api`. Task endpoints require an
`Authorization: Bearer <accessToken>` header obtained from `/api/auth/login` or
`/api/auth/refresh`.

### Auth

| Method | Endpoint            | Description                          | Body |
|--------|----------------------|---------------------------------------|------|
| POST   | `/api/auth/login`    | Log in. Returns a short-lived access token + user in the body, and sets a rotating refresh token as an httpOnly cookie. | `{ email, password }` |
| POST   | `/api/auth/refresh`  | Reads the refresh-token cookie, rotates it, and returns a new access token. Used to silently re-authenticate after the access token expires (e.g. on page reload). | – (cookie only) |
| POST   | `/api/auth/logout`   | Revokes the refresh-token session server-side and clears the cookie. | – |
| GET    | `/api/auth/me`       | Get the current authenticated user (auth required). | – |

**Login example**

```bash
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'
```

**Refresh example** (reuses the cookie jar from login)

```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost:5000/api/auth/refresh
```

> Why two tokens? The access token is short-lived (15 minutes by default) and sent on
> every request via the `Authorization` header, limiting the damage if it's ever leaked.
> The refresh token is long-lived (7 days), never touched by client-side JavaScript
> (httpOnly cookie), and rotated on every use — each row in the `refresh_tokens` table
> is a revocable session, so logging out (or an admin deleting the row) immediately
> invalidates it.

### Tasks (all require `Authorization: Bearer <accessToken>`)

| Method | Endpoint                  | Description |
|--------|----------------------------|--------------|
| GET    | `/api/tasks`                | List tasks. Supports query params: `search`, `status`, `priority`, `sort`, `page`, `limit` |
| GET    | `/api/tasks/:id`             | Get a single task |
| POST   | `/api/tasks`                 | Create a task |
| PUT    | `/api/tasks/:id`              | Update a task |
| DELETE | `/api/tasks/:id`              | Delete a task |
| PATCH  | `/api/tasks/bulk/status`      | Bulk-update status for multiple tasks — body: `{ ids: number[], status }` |
| DELETE | `/api/tasks/bulk`             | Bulk-delete multiple tasks — body: `{ ids: number[] }` |
| GET    | `/api/tasks/stats/dashboard`  | Dashboard counters (total/pending/in-progress/completed/overdue) + priority breakdown |

**Query parameters for `GET /api/tasks`** (combinable):

- `search` — matches task title (partial, case-insensitive)
- `status` — `Pending` \| `In Progress` \| `Completed`
- `priority` — `Low` \| `Medium` \| `High`
- `sort` — `newest` (default) \| `oldest` \| `due_date`
- `page` — page number, default `1`
- `limit` — items per page, default `10`, max `100`

Example: `GET /api/tasks?status=Pending&priority=High&sort=due_date&page=2&limit=8`

**List response shape**

```json
{
  "success": true,
  "count": 8,
  "data": {
    "tasks": [ /* ... */ ],
    "pagination": { "total": 23, "page": 2, "limit": 8, "totalPages": 3 }
  }
}
```

**Task JSON shape**

```json
{
  "id": 1,
  "user_id": 1,
  "title": "Prepare quarterly report",
  "description": "Optional details",
  "priority": "High",
  "status": "Pending",
  "due_date": "2026-08-01",
  "created_at": "2026-07-21 07:07:54",
  "updated_at": "2026-07-21 07:07:54"
}
```

**Create/Update body**

```json
{
  "title": "Prepare quarterly report",
  "description": "Optional details",
  "priority": "High",
  "status": "Pending",
  "due_date": "2026-08-01"
}
```

`title`, `priority`, `status`, and `due_date` are required. On create, `due_date`
cannot be earlier than today. `description` is optional.

All responses use the shape `{ success, message?, data? }`, and validation errors use
`{ success: false, message: "Validation failed", errors: [{ field, message }] }`.

**Rate limiting:** `POST /api/auth/login` is limited to 10 attempts per 15 minutes per
IP; all other `/api/*` routes are limited to 120 requests per minute per IP. Both return
`429` with a JSON `{ success: false, message }` body when exceeded.

## Running with Docker

A `docker-compose.yml` in the project root spins up MySQL, the backend, and the
frontend together — no local Node.js or MySQL installation required.

```bash
cp .env.docker.example .env   # then edit the secrets
docker compose up --build
```

- MySQL is seeded automatically from `backend/database/schema.sql` on first boot
  (via the container's `docker-entrypoint-initdb.d` mechanism).
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- To stop and remove containers: `docker compose down` (add `-v` to also wipe the
  MySQL data volume).

## CI/CD & Deployment (Vercel)

This project ships with two GitHub Actions workflows in `.github/workflows/`:

- **`ci.yml`** — runs on every push and pull request. It installs both apps, syntax-checks
  the backend, spins up a real MySQL service container, loads `schema.sql` into it, boots
  the API, and smoke-tests `/api/health` + login. The frontend job installs and runs a
  production build. Nothing gets deployed here — it's a safety net.
- **`deploy.yml`** — runs on every push to `main` (or manually via "Run workflow"). It
  deploys the backend and the frontend as **two separate Vercel projects** using the
  official `vercel pull` → `vercel build` → `vercel deploy --prebuilt` CLI flow.

### One-time setup (do this before the first deploy)

1. **Create a MySQL database Vercel can reach.** Vercel's serverless functions don't host
   a database — use a managed MySQL provider with a public/proxied connection string,
   e.g. [PlanetScale](https://planetscale.com), [Railway](https://railway.app), or
   [Aiven](https://aiven.io). Run `backend/database/schema.sql` against it once (most of
   these providers give you a web console or a `mysql` connection string you can pipe the
   file into, the same way you would locally).

2. **Create two Vercel projects** (via the Vercel dashboard, "Add New… → Project", or the
   `vercel` CLI's `vercel link` from inside each folder):
   - one importing this repo with **Root Directory = `backend`**
   - one importing this repo with **Root Directory = `frontend`**

   Vercel will detect `backend/vercel.json` (serverless Node function) and
   `frontend/vercel.json` (static Vite build) automatically.

3. **Set environment variables** in each Vercel project's Settings → Environment Variables:

   **Backend project:**
   ```
   DB_HOST=<your managed MySQL host>
   DB_PORT=3306
   DB_NAME=task_management
   DB_USER=<your db user>
   DB_PASSWORD=<your db password>
   JWT_SECRET=<long random string>
   JWT_REFRESH_SECRET=<a different long random string>
   ACCESS_TOKEN_EXPIRES_IN=15m
   REFRESH_TOKEN_EXPIRES_IN=7d
   CLIENT_URL=https://<your-frontend-project>.vercel.app
   COOKIE_SAME_SITE=none
   NODE_ENV=production
   ```
   (`COOKIE_SAME_SITE=none` is required because the frontend and backend live on two
   different `vercel.app` domains — see the note in `.env.example`.)

   **Frontend project:**
   ```
   VITE_API_BASE_URL=https://<your-backend-project>.vercel.app/api
   ```

4. **Add repository secrets** under GitHub → Settings → Secrets and variables → Actions,
   so `deploy.yml` can push new deploys on your behalf:
   - `VERCEL_TOKEN` — create one at https://vercel.com/account/tokens
   - `VERCEL_ORG_ID` — found in each Vercel project's Settings → General ("Team ID" /
     "Your ID"), or in `.vercel/project.json` after running `vercel link` locally once
   - `VERCEL_PROJECT_ID_BACKEND` — the backend project's ID (same location as above)
   - `VERCEL_PROJECT_ID_FRONTEND` — the frontend project's ID
   - `VITE_API_BASE_URL` — same value as the frontend env var above

5. Push to `main` (or click **Run workflow** on `deploy.yml` in the Actions tab). The
   workflow deploys the backend first, then the frontend, so the API is live before the
   frontend build that points at it runs.

### Deploying manually instead (no GitHub Actions)

You can skip the pipeline entirely and deploy straight from your machine with the
[Vercel CLI](https://vercel.com/docs/cli):

```bash
npm install --global vercel

cd backend
vercel link          # first time only — choose/create the backend project
vercel env pull      # optional, to sync env vars locally
vercel --prod

cd ../frontend
vercel link          # first time only — choose/create the frontend project
vercel --prod
```

## Assumptions Made

- No registration flow — a single account is seeded per the brief, and login is the
  only auth entry point.
- Authentication uses a short-lived (15 min) JWT access token plus a rotating,
  httpOnly-cookie refresh token (7 days), each backed by a revocable row in the
  `refresh_tokens` table. The frontend keeps the access token in memory only (never in
  `localStorage`) and silently calls `/api/auth/refresh` on page load / on a 401 to stay
  logged in — this is deliberately more involved than a single long-lived JWT, in
  exchange for a smaller exposure window if a token leaks.
- The `due_date < today` validation rule is enforced on **create** only. Editing an
  already-overdue task is still allowed (e.g. to change its status to Completed or push
  the due date forward) without being blocked by that rule.
- Search matches on task **title** only, per the requirements; it is not case-sensitive.
- "Overdue" is computed as: status is not `Completed` and `due_date` is before today —
  calculated both in the dashboard stats query (backend) and re-derived in the UI for
  the task list badges.
- Passwords are hashed with bcrypt before being stored/compared; the seeded password
  hash in `schema.sql` was generated and verified against `123456`.
- The task list is paginated at 8 tasks per page on the frontend (configurable via
  `PAGE_SIZE` in `frontend/src/pages/Tasks.jsx`); the API defaults to 10 per page if
  called without a `limit`.

## Known Limitations

- No password reset / "forgot password" flow (out of scope per the brief).
- No automated test suite included (marked optional/bonus in the brief).
- Not deployed to a public URL; run locally via the steps above, or with Docker.
- Dark mode was intentionally not implemented — the brief listed it as optional, and
  this UI is deliberately light/white with a single green accent throughout.
