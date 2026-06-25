# Feature Modules

Each subfolder here is a **self-contained feature module**. A module owns
everything specific to one domain concept and exposes a small public surface to
the rest of the app.

## Anatomy of a module

```
modules/<feature>/
├── components/   # UI specific to this feature (not shared elsewhere)
├── hooks/        # TanStack Query hooks + local UI hooks for this feature
├── services/     # Data-access / API-client functions (the only place that calls fetch/prisma for this feature)
├── schemas/      # Zod schemas (input validation, shared by form + API)
├── types/        # TypeScript types/interfaces for this feature
└── index.ts      # (optional) public barrel — the module's intended API
```

## Rules of thumb

1. **Feature code lives in its module.** If something is used by only one
   feature, it belongs here — not in the global `components/` or `lib/`.
2. **Promote, don't duplicate.** When a second feature needs something, move it
   to a shared location (`components/shared`, `lib/`, `hooks/`).
3. **Cross-module imports go through the barrel** (`@/modules/<feature>`), never
   deep into another module's internals.
4. **Services are the data boundary.** Components/hooks call services; services
   call the API or Prisma. This keeps data logic testable and swappable.
5. **Schemas are shared** between the client form (React Hook Form resolver) and
   the server route, so validation is identical on both sides.

Shared, cross-cutting code lives outside `modules/`:

- `@/components/ui` — design-system primitives (Shadcn)
- `@/lib` — framework-agnostic infrastructure (prisma, auth, api, permissions)
- `@/hooks` — cross-feature hooks
- `@/types` — cross-cutting types

## Planned modules

`auth` · `users` · `roles` · `permissions` · `tickets` · `customers` ·
`reports` · `dashboard` · `qr` · `settings` · `audit-logs`

> Empty module folders are intentionally not tracked by git (git can't track
> empty directories). Create a module's folders when you add its first file,
> following the anatomy above. This single README is the source of truth for the
> convention — there are no per-module README files.
