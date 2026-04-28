# Auth Missing Secret Fix

author: adnan

date: 2026-04-18

domain: patient

title: Fix Auth.js MissingSecret runtime error

---

## Summary
Fixed Auth.js runtime error `MissingSecret: Please define a secret` by adding explicit `secret` resolution in auth configuration.

## Files Created
- docs/changes/adnan_2026-04-18_auth-missing-secret-fix.md

## Files Modified
- lib/auth/index.ts

## Shared Files Touched
- lib/auth/index.ts

## What Was Added
- `resolveAuthSecret()` helper in auth config.
- Env-first secret lookup (`AUTH_SECRET`, fallback `NEXTAUTH_SECRET`).
- Development fallback secret to prevent local crashes when env vars are not set.
- Production hard-fail with clear error when secret is missing.

## Known Issues
- Development fallback secret is intentionally static; should be replaced by a real env secret for stable sessions across environments.

## How to Test
1. Start/restart dev server.
2. Open a protected route (e.g., /patient/dashboard).
3. Confirm no `MissingSecret` error appears in console.
4. Login and confirm session works normally.
