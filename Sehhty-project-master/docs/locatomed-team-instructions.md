# LOCATOMED Team Development Instruction

## Team Ownership
- Developer 1: Patient area
- Developer 2: Doctor area
- Developer 3: Hospital admin area
- Developer 4: Pharmacy area

Each developer must work only inside their assigned feature/domain unless a shared file really needs to be changed.

---

## Main Goal
Work in parallel with minimal merge conflicts, clear boundaries, and predictable code structure.

---

## Core Rules

### 1. Respect Feature Ownership
Each developer owns only their domain:
- Patient developer: patient pages, components, hooks, services
- Doctor developer: doctor dashboard and features
- Hospital developer: hospital admin dashboard and features
- Pharmacy developer: pharmacy dashboard and features

Do not edit another developer’s domain files unless the team explicitly agrees.

### 2. Shared Files Must Be Protected
Shared files (global layout, shared UI, auth/session, db schema, middleware, navigation, package.json, global styles, utils) must not be modified casually. If a shared file must be changed:
- Document it first
- Keep the change minimal
- Notify the team before changing

### 3. Work by Feature Folders
Organize code by role/feature. Example structure:

app/
  patient/
  doctor/
  hospital-admin/
  pharmacy/

features/
  patient/
  doctor/
  hospital/
  pharmacy/

components/
  shared/
  ui/

lib/
  auth/
  db/
  utils/

docs/
  changes/

Each developer should mainly work inside their own feature folder.

### 4. Never Put All Logic in Pages
Pages should stay thin. Put logic in feature components, hooks, server actions, services, and validation schemas.

### 5. Keep Strict Boundaries
- Patient developer should not write doctor business logic
- Pharmacy developer should not modify hospital logic
- Doctor developer should not edit patient feature files
- Hospital developer should not redesign shared UI without agreement

### 6. Shared Contracts Must Be Stable
Before coding, agree on naming conventions, folder structure, shared component usage, data types, API/action patterns, form validation style, and documentation format.

---

## Branch Strategy
Each developer must work in a separate branch. Naming example:
- feature/patient-dashboard
- feature/doctor-dashboard
- feature/hospital-admin-dashboard
- feature/pharmacy-dashboard

Never code directly on main. Pull latest main before starting work. Push frequently. Open pull requests with clear descriptions.

---

## File Ownership Guidance
- Patient developer: patient files only
- Doctor developer: doctor files only
- Hospital admin developer: hospital files only
- Pharmacy developer: pharmacy files only

---

## AI-Generated Code Rules
- Generate only inside your assigned scope
- Avoid large uncontrolled refactors
- Ask for minimal edits
- Review AI output before applying

---

## Documentation Rule (MANDATORY)
Every change must be documented in docs/changes/.

File naming: [developer-name]_[date]_[short-title].md

Content must include:
- Change Title
- Author
- Date
- Domain
- Summary
- Files Created
- Files Modified
- Shared Files Touched (and why)
- What Was Added
- What Was NOT Changed
- Known Issues
- How to Test

No code should be pushed without documentation. One feature/change = one documentation file. If missing, the change is considered incomplete.

When using AI to generate code, also generate the documentation content and review before saving.

---

## Conflict Prevention
Never edit shared files at the same time unless the team agrees first. If you need a shared change: announce it, explain why, keep it minimal, and document it clearly.

---

## UI and Code Quality Rules
- Keep the current visual identity
- Use the existing shared UI system
- Do not create a different style per role
- Keep code simple and readable
- Avoid overengineering
- Use clear naming
- Keep components small
- Reuse shared UI components
- Use role-based feature separation
- Avoid duplication, but do not force abstraction too early

---

## Recommended Working Method
1. Create feature folder structure
2. Create static UI pages/components
3. Connect real data
4. Add forms/actions
5. Add validation
6. Test role protection
7. Document the change

---

## Important Restrictions
Do not let AI modify unrelated domains, rewrite the entire app, move all files automatically, break auth/session, change route names globally, or change shared layout without approval.

---

## Final Instruction for AI
- Only work inside the assigned domain
- Preserve all other domains
- Do not refactor unrelated files
- Keep changes minimal and isolated
- Mention every touched file
- Provide documentation content for the change
- Warn before changing any shared file
