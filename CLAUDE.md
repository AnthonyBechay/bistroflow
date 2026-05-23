# BistroFlow - Project Rules & Context

## Overview
Web app for BistroFlow — a general-purpose restaurant operations & management platform.
Features: landing page, login, recipe management, menu builder, employee scheduling, Operations (orders, checklists, food temp logs, receipt archiving).

## Tech Stack
- **Monorepo**: pnpm workspaces (`backend/`, `frontend/`)
- **Backend**: Express.js + TypeScript + Prisma ORM + PostgreSQL 16
- **Frontend**: React 19 + Vite 6 + TypeScript + React Router DOM 7 + Lucide React icons
- **Styling**: Vanilla CSS with CSS variables (dark warm theme, Playfair Display + Inter fonts)
- **Auth**: JWT (bcryptjs + jsonwebtoken), 24h expiry, Bearer token in Authorization header
- **Dev DB**: PostgreSQL via Docker on port 5433 (port 5432 is used by another project)

## Development

### Running locally
```bash
# Start dev database
docker compose -f docker-compose.dev.yml up -d

# Start backend (from root)
pnpm dev:backend

# Start frontend (from root)
pnpm dev:frontend
```

### Database
- Dev connection: `postgresql://bistroflow:bistroflow_secret@localhost:5433/bistroflow`
- Seed user: `admin@bistroflow.com` / `admin123` (name: "Manager")

## Critical Rules

### Git
- Configure the user's remote and push when instructed.

### Prisma Migrations
- **NEVER modify existing migration files** — always create new migrations
- Use `npx prisma migrate dev --name descriptive_name` for schema changes

### Preview Testing
- **Do NOT test in preview unless explicitly asked** by the user
- When testing, use the launch.json config (frontend on port 5173)

### Deployment
- **Docker single-stage build using `npm install`** (NOT pnpm — symlinks break during Docker COPY)
- Dockerfile is at `backend/Dockerfile`, builds both backend and frontend
- Backend serves frontend as static files from `/app/public`
- Production uses `docker-compose.yml` with Coolify and external `coolify` network
- `VITE_API_URL=/api` is set as build arg in Docker
- CMD runs: prisma migrate resolve (for init), prisma migrate deploy, seed, then node server
- `.dockerignore` excludes `node_modules`, `*/node_modules`, `*/dist` to prevent COPY conflicts

### Docker Build Lessons
- pnpm's symlinked node_modules break when copied between Docker stages — use npm install instead
- `npx prisma` in Docker can try downloading a new version — single-stage build avoids this
- Always have `.dockerignore` to prevent local `node_modules` from conflicting with Docker build

### Package Configuration
- `pnpm.onlyBuiltDependencies` goes in root `package.json` under the `"pnpm"` key (not `.npmrc`)
- Backend `tsconfig.json` has `declaration: false` to avoid TS2742 errors with Express Router

### Code Style
- Vanilla CSS (no CSS-in-JS, no Tailwind)
- CSS uses custom properties defined in global styles (--color-primary, --color-surface, etc.)
- All API calls go through `frontend/src/lib/api.ts` fetch wrapper with JWT auth

## Project Structure
```
bistroflow/
  backend/
    src/
      routes/       # Express route handlers
      middleware/    # auth middleware
      index.ts      # Express server entry
    prisma/
      schema.prisma
      seed.ts / seed.js
      migrations/
    Dockerfile      # Production build (single-stage, npm)
  frontend/
    src/
      pages/        # React page components + CSS
      components/   # Layout, Modal
      lib/          # api.ts
  docker-compose.yml      # Production (Coolify)
  docker-compose.dev.yml  # Dev PostgreSQL (port 5433)
  docker-compose.test.yml # Full local Docker test
```

## Key API Routes
- `POST /api/auth/login` — JWT login
- `/api/categories`, `/api/subcategories`, `/api/ingredients`, `/api/recipes` — Recipe CRUD
- `/api/menus` — Menu CRUD with items
- `/api/restaurants` — Restaurant CRUD
- `/api/employees` — Employee CRUD (supports color, hourlyRate, isActive)
- `/api/schedules` — Schedule CRUD
  - `GET /:id/summary` — Weekly hours summary with daily breakdown and estimated pay
  - `GET /report/:restaurantId` — Multi-week report
  - `POST /:id/duplicate` — Duplicate schedule to new week
  - `POST /:id/shifts/bulk` — Bulk add shifts
  - `PUT /shifts/:shiftId`, `DELETE /shifts/:shiftId` — Shift management
