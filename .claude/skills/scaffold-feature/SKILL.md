---
name: scaffold-feature
description: Scaffolds a new feature end-to-end across database, server actions, and UI following LOCATOMED conventions. USE THIS SKILL whenever the user asks to "add", "build", "create", or "implement" any new feature, page, CRUD flow, or functionality — even if they don't explicitly say "scaffold". Always use this before adding any new entity or screen to the project.
---

# Scaffold a new feature

## When to use
- User asks to add a new feature, entity, page, or CRUD flow
- Any new database table + UI combination
- Before touching more than 2 files to implement something new

## The LOCATOMED vertical slice (SQLite edition)

Every feature goes through the same layers, in this order:

1. **Schema update** — edit `lib/db/schema.ts`, add table + relations
2. **Generate migration** — `npm run db:generate` produces SQL in `drizzle/migrations/`
3. **Apply migration** — `npm run db:migrate`
4. **Zod schema** — `lib/schemas/<feature>.ts` for input validation
5. **Queries** — `lib/db/queries/<feature>.ts` — reusable Drizzle queries
6. **Server Actions** — `app/<role>/<feature>/actions.ts`
   - Every action starts with `requireRole()` — see `authorization` skill
   - Zod-validate input
   - Call the query, wrap in try/catch, return `{ ok, data } | { ok: false, error }`
7. **Page (Server Component)** — `app/<role>/<feature>/page.tsx`
   - `await requireRole(...)` at the top
   - Fetch data via query functions
   - Pass to Client Components as props
8. **Client Components** — `components/locatomed/<feature>/*.tsx` with `"use client"`
   - Forms: React Hook Form + Zod resolver
   - Call Server Actions via `useTransition`
   - Toast on success/error
9. **Seed update** — add fixtures to `scripts/seed.ts`

## Checklist for every feature

- [ ] Schema updated, migration generated AND applied
- [ ] Types flow through from Drizzle schema (no duplicate type definitions)
- [ ] Every server action has `requireRole()` as first line
- [ ] Every query is scoped to the authenticated user's allowed rows
- [ ] Empty state designed (not just "no data")
- [ ] Loading skeleton visible for ≥300ms operations
- [ ] Toast on success, error toast on failure
- [ ] Mobile layout verified for patient-facing features
- [ ] Seed data includes at least 3 realistic examples
- [ ] Feature appears in demo flow (`docs/demo-script.md`)

## Pitfalls
- Don't forget `npm run db:migrate` after `db:generate` — generation alone
  creates the SQL but doesn't apply it
- Don't query Drizzle from Client Components — always Server Component or Action
- Don't skip the seed update — the demo WILL break otherwise
- Don't define types manually when Drizzle's `$inferSelect` / `$inferInsert` exist
- Don't introduce a new library without checking CLAUDE.md
