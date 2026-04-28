# Login Redirect Fix

author: adnan

date: 2026-04-18

domain: patient

title: Fix success login toast without navigation

---

## Summary
Fixed the login flow where users saw a success toast but remained on the login page.

## Files Created
- docs/changes/adnan_2026-04-18_login-redirect-fix.md

## Files Modified
- components/locatomed/login-form.tsx
- lib/auth/login.ts
- proxy.ts

## Shared Files Touched
- components/locatomed/login-form.tsx
- lib/auth/login.ts
- proxy.ts

## What Was Added
- Login action now returns a deterministic redirect path (`redirectTo`) based on role dashboard mapping.
- Login form now performs `router.push(redirectTo)` on successful authentication.
- Proxy role dashboard mapping aligned for patient route (`/patient/dashboard`).

## Known Issues
- None specific to this fix.

## How to Test
1. Open `/patient/login`
2. Login with `fatima@locatomed.ma` / `demo123`
3. Confirm success toast appears and page navigates to `/patient/dashboard`
4. Repeat on other role login pages to confirm redirect works for each role
