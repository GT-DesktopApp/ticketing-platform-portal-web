# Ticketing Platform — Admin Web

Internal admin console for a Ticketing & POS management system (ticket
creation/printing, QR generation & verification, customers, users, RBAC,
audit logs, reports, multi-branch/location operations, and more).

This repository currently contains the **production-ready foundation** — the
architecture, tooling, and infrastructure on which features are built. Business
features are intentionally **not** implemented yet (see _Roadmap_).

---

## Tech Stack

| Concern            | Choice                                   | Notes |
| ------------------ | ---------------------------------------- | ----- |
| Framework          | **Next.js 16** (App Router)              | React 19, Server Components by default |
| Language           | **TypeScript** (strict)                  | `@/*` absolute imports |
| Styling            | **Tailwind CSS v4** + **Shadcn UI**      | CSS-first config, OKLCH design tokens |
| Database           | **Neon PostgreSQL**                      | Serverless Postgres |
| ORM                | **Prisma 6**                             | Singleton client, explicit join tables |
| Auth               | **Auth.js (NextAuth v5)**                | JWT sessions, edge-safe proxy split |
| Validation         | **Zod 4**                                | Shared client+server schemas, env validation |
| Server state       | **TanStack Query 5**                     | Per-feature query hooks |
| Tables             | **TanStack Table 8**                     | |
| Forms              | **React Hook Form 7**                    | Zod resolver |
| Icons              | **Lucide React**                         | |
| Notifications      | **Sonner**                               | Mounted app-wide in providers |
| Tooling            | **ESLint 9** (flat) + **Prettier**       | `simple-import-sort` for import order |

---

## Prerequisites

- **Node.js LTS** (v20+)
- **npm** (this project standardizes on npm; a `package-lock.json` is committed)
- A **Neon PostgreSQL** database (or any PostgreSQL instance)

---

## Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file from the template
cp .env.example .env
#    → fill in DATABASE_URL and generate NEXTAUTH_SECRET (see below)

# 3. Generate the Prisma client
npm run prisma:generate

# 4. Create the database schema (dev) and seed RBAC + a Super Admin
npm run db:migrate      # creates tables via a migration
npm run db:seed         # seeds permissions, roles, and the bootstrap admin

# 5. Start the dev server
npm run dev             # http://localhost:3000
```

### Environment Setup

All variables are validated at startup by [`src/config/env.ts`](src/config/env.ts)
using Zod — a missing or malformed value fails fast with a clear message.

| Variable          | Required | Description |
| ----------------- | -------- | ----------- |
| `DATABASE_URL`    | ✅       | Neon **pooled** connection string (`...-pooler...`) |
| `NEXTAUTH_URL`    | ✅       | App URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | ✅       | ≥32 chars. Generate: `openssl rand -base64 32` |
| `NODE_ENV`        | —        | `development` \| `test` \| `production` |

> Never commit `.env`. Only `.env.example` is tracked.

---

## Prisma Commands

| Script                      | What it does |
| --------------------------- | ------------ |
| `npm run prisma:generate`   | Regenerate the typed Prisma client |
| `npm run db:migrate`        | Create & apply a dev migration (`prisma migrate dev`) |
| `npm run db:deploy`         | Apply migrations in CI/production (`migrate deploy`) |
| `npm run db:push`           | Push schema without a migration (prototyping only) |
| `npm run db:seed`           | Seed permissions, roles, and the bootstrap Super Admin |
| `npm run db:studio`         | Open Prisma Studio (DB GUI) |
| `npm run db:reset`          | Drop, re-migrate, and re-seed (destructive) |

**Seeded Super Admin** (override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`):
`admin@ticketing.local` / `ChangeMe123!` — **change immediately.**

---

## Development Workflow

```bash
npm run dev            # start dev server (Turbopack)
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run lint:fix       # ESLint with autofix (sorts imports)
npm run format         # Prettier write
npm run build          # production build
```

Recommended pre-commit loop: `npm run lint:fix && npm run typecheck && npm run build`.

**Conventions**

- **Server Components by default**; add `"use client"` only when you need state,
  effects, or browser APIs.
- **Absolute imports** via `@/…` — no deep relative `../../..` paths.
- **Imports are auto-sorted** (external → `@/…` → relative). Run `lint:fix`.
- **One feature = one module** under `src/modules/<feature>` (see
  [`src/modules/README.md`](src/modules/README.md)).

---

## Folder Structure

```
src/
├── app/                      # Next.js App Router (routes only)
│   ├── (auth)/               # Route group: unauthenticated screens (login)
│   ├── (dashboard)/          # Route group: authenticated app shell
│   └── api/                  # Route handlers (REST), consistent envelope
│       ├── auth/             # Auth.js catch-all
│       ├── users/ roles/ …   # Resource endpoints (guarded)
│       └── health/           # Liveness check
│
├── modules/                  # FEATURE MODULES (the core of the app)
│   ├── auth/ users/ roles/ permissions/ tickets/ customers/
│   ├── reports/ dashboard/ qr/ settings/ audit-logs/
│   └── <feature>/{components,hooks,services,schemas,types}
│
├── components/               # Shared, cross-feature UI
│   ├── ui/                   # Shadcn primitives (Button, …)
│   ├── forms/                # Reusable form building blocks
│   ├── layouts/              # Sidebar, Header, Breadcrumb, UserMenu
│   └── shared/               # Misc shared components (e.g. <Can/>)
│
├── lib/                      # Framework-agnostic infrastructure
│   ├── prisma/               # Prisma singleton client
│   ├── auth/                 # Auth.js config (edge-safe split + full)
│   ├── api/                  # API response envelope + pagination
│   ├── permissions/          # RBAC predicates + server guards
│   ├── constants/            # roles, permissions, routes
│   ├── validations/          # Shared Zod primitives
│   └── utils/                # cn(), formatters, helpers
│
├── hooks/                    # Cross-feature hooks (e.g. usePermissions)
├── services/                 # Cross-feature data services (reserved)
├── providers/                # Client providers (Query, Theme, Auth, Sonner)
├── config/                   # app config, env validation, navigation
├── types/                    # Cross-cutting types + next-auth augmentation
└── proxy.ts                  # Edge auth proxy (Next 16 "middleware")

prisma/
├── schema.prisma             # DB models (UUID PKs, timestamps, RBAC, audit)
└── seed.ts                   # Idempotent RBAC + admin seed
```

### Why this structure?

- **Feature-based, not type-based.** Adding "tickets" touches one folder
  (`modules/tickets`), not five scattered ones. This scales to dozens of
  features without a tangle.
- **`lib` is infrastructure, `modules` is product.** Anything reusable and
  framework-y (prisma, auth, api envelope, RBAC) lives in `lib`; domain logic
  lives in `modules`.
- **`app` holds only routing.** Pages are thin and delegate to modules — so the
  router stays readable and features stay testable in isolation.

---

## Architecture Highlights

### RBAC

- The permission **catalog** is a typed constant (`lib/constants/permissions.ts`)
  of `"<resource>.<action>"` strings — added by appending + re-seeding, no schema
  change. Roles (`lib/constants/roles.ts`) map to default permission sets.
- **Pure predicates** (`lib/permissions/check.ts`) power both server guards and
  client UI gating, so they never disagree.
- **Server guards** (`requirePermission(...)`) throw typed errors that the API
  envelope turns into `401/403`. **Client gating** uses `<Can>` /
  `usePermissions()` — UX only; the server is the real boundary.
- **Super Admin** is a wildcard at check-time, so new permissions are granted to
  it automatically.

### API Contract

Every endpoint returns the same envelope:

```jsonc
// success
{ "success": true,  "message": "…", "data": { … }, "meta": { "pagination": { … } } }
// error
{ "success": false, "message": "…", "data": null, "errors": { "field": ["…"] } }
```

Built with `ok() / created() / fail() / handleApiError()` from `@/lib/api`.
[`/api/users`](src/app/api/users/route.ts) is the canonical template (guard →
paginate → query → envelope → centralized error handling).

### Auth (Foundation)

Auth.js v5 is wired with a **split config**: an edge-safe `auth.config.ts`
(used by `proxy.ts` for route protection) and a full `auth.ts` (Prisma adapter +
Credentials provider). The credential check is a clearly-marked **stub** — the
foundation is complete; turning on login is a one-function change documented in
the file.

---

## Roadmap (not yet implemented)

Ticket creation/printing · QR generation & verification · Customer & User
management UIs · Role/Permission editors · Audit log viewer · Reports &
analytics · Bulk Excel/CSV upload · Live dashboard · Multi-branch/location admin
· Counter operations (Toy Train / Paddle Boat / Attractions) · Mobile app API.

Build each as a module under `src/modules/<feature>`, following the patterns the
foundation establishes.
```
