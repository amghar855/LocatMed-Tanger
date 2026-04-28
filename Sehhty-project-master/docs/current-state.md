# LOCATOMED — Current State Documentation

This document describes the **actual current state of the application based on the code in this repository**.

It intentionally separates:

- **Implemented now** — features that are already wired into the app and usable.
- **Partially implemented** — features with some backend/UI groundwork but not a complete user experience.
- **Upcoming / inferred next work** — areas strongly suggested by the schema, seed data, dependencies, and project scaffold, but **not yet shipped in the UI**.

If you use this document for planning, treat the “upcoming” section as a **technical roadmap inferred from the repo**, not as a formal product commitment.

---

## 1. Product Summary

LOCATOMED is a **multi-role digital health app for Morocco** with a strong Tangier-focused demo dataset.

The product direction is clear:

- patients should be able to find medicines, book appointments, and access their health records,
- doctors should manage appointments and patient records,
- pharmacists should manage medicine availability and stock,
- hospital administrators should manage doctors attached to their institution.

At the moment, the app is in a **strong foundation / early feature stage**:

- the **authentication system is largely in place**,
- the **role model is in place**,
- the **database model already covers the main healthcare flows**,
- **seed/demo data is rich**,
- but only a **small part of the intended product experience is currently visible in the UI**.

In short: **the platform skeleton is solid, but most domain features are still ahead of the dashboards**.

---

## 2. Tech Stack and Architecture

### Frontend

- **Next.js 16** with the App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **shadcn/ui-style UI primitives** in `components/ui/`
- **Sonner** for toast notifications
- **Lucide React** for icons

### Backend / App Logic

- **Server Actions** handle form submissions for login, signup, and doctor creation
- **Auth.js / NextAuth v5 beta** handles sessions and credential auth
- **Role-based redirect protection** is handled in `proxy.ts`
- **Zod** validates authentication forms and doctor creation inputs
- **bcryptjs** hashes and verifies passwords

### Database

- **SQLite** via `better-sqlite3`
- **Drizzle ORM** for schema and queries
- Database file stored locally at `data/locatomed.db`

### Data / Demo Setup

- Demo hospitals loaded from `data/hospitals-tanger.json`
- Demo pharmacies loaded from `data/pharmacies-tanger.json`
- Medicines loaded from `data/medicaments.csv`
- Seed script creates realistic Tangier demo data and demo users

### Architectural Pattern

The current architecture is straightforward and clean:

1. **Route-level UX** lives under `app/`
2. **Shared role forms** live under `components/locatomed/`
3. **Auth/session logic** lives under `lib/auth/`
4. **Schema and DB access** live under `lib/db/`
5. **Route protection and auto-redirects** live in `proxy.ts`

This makes the app easy to expand feature-by-feature.

---

## 3. Overall Status Snapshot

## Shipped and Working

- Landing page with clear role entry points
- Role-specific login pages
- Self-signup for patients, hospital admins, and pharmacists
- Doctor account creation by hospital admins
- Password hashing and credential-based login
- JWT session creation
- Role-based dashboard redirects
- Route protection and cross-role access blocking
- Logout flow
- Rich demo seed data and local SQLite persistence

## Partially Implemented

- Hospital administrator dashboard
- Doctor management inside hospital admin space
- Role dashboards for patient, doctor, and pharmacist
- Generic/auth scaffolding left in the repo from earlier iterations

## Not Yet Shipped in the UI

- Medicine search experience
- Pharmacy availability lookup
- Pharmacy stock management UI
- Appointment booking and appointment lists
- Medical folder / health record UI
- Doctor-facing patient record workflows
- Patient-facing record history views
- Full bilingual internationalization

---

## 4. Current User-Facing Features

## 4.1 Landing Page

The home page is implemented and acts as the app’s central role selector.

Current behavior:

- Presents four entry cards:
  - Patient
  - Doctor
  - Hospital administrator
  - Pharmacist
- Each card links directly to the appropriate login page
- A secondary footer exposes signup links only for roles that support self-registration
- Doctors are explicitly told that their account must be created by a hospital administrator

What this means:

- the product already uses a **multi-portal structure**,
- users do **not** enter through one shared login anymore,
- role separation is already a first-class concept in the UX.

---

## 4.2 Authentication and Session System

Authentication is one of the most complete parts of the app right now.

### Current auth model

- Authentication uses **email + password credentials only**
- No OAuth providers are currently configured
- No magic-link or SMS-based auth is present
- Passwords are stored as **bcrypt hashes**
- Sessions use **JWT strategy**

### Role model

The app supports four roles:

- `patient`
- `hospital_admin`
- `doctor`
- `pharmacist`

### Current login behavior

Each role has its own login screen:

- `/patient/login`
- `/doctor/login`
- `/hospital-admin/login`
- `/pharmacy/login`

When a user logs in:

- the email/password is validated,
- the user is fetched from SQLite,
- the password hash is checked,
- the user’s role is verified against the role-specific portal they used,
- a session is created,
- the app refreshes and `proxy.ts` redirects the user to the correct dashboard.

### Important UX detail already implemented

If a user tries to log in from the wrong portal, the app returns a **friendly role mismatch message** instead of a generic failure.

Example:

- a patient trying to log in through the pharmacist portal gets a message explaining the account is not a pharmacist account.

### Route protection already in place

`proxy.ts` currently handles:

- redirecting authenticated users away from auth pages,
- redirecting authenticated users from `/` to their dashboard,
- redirecting unauthenticated users trying to access protected role areas,
- blocking cross-role access, for example:
  - doctors cannot open patient pages,
  - pharmacists cannot open hospital admin pages,
  - patients cannot open doctor pages.

### Logout

- `GET /logout` signs the user out and sends them back to `/`
- this flow is already integrated into the shared dashboard navigation

### Legacy auth routes

The old generic auth routes still exist:

- `/login`
- `/signup`

But they now simply redirect back to `/`.

So from a product perspective, the app has already moved to **role-specific authentication portals**.

---

## 4.3 Signup Flows

### Self-signup available today

The following roles can create their own account:

- Patient
- Hospital administrator
- Pharmacist

### Doctor signup model

Doctors **cannot self-register**.

Current model:

- doctor accounts are created internally by a hospital administrator,
- the doctor then logs in through `/doctor/login`.

This is a good domain decision and is already reflected in both the UI and the backend logic.

### Signup validation already implemented

Current signup flows validate:

- full name
- email format
- password length
- password confirmation match
- selected hospital for hospital admins
- selected pharmacy for pharmacists

### Important dependency on demo data

Signup for hospital admins and pharmacists depends on seeded reference data.

If the hospitals or pharmacies tables are empty:

- the UI tells the user to run the seed first,
- the dropdown selectors cannot be completed.

That means the app already assumes a **reference-data-first onboarding model**.

---

## 4.4 Role Dashboards

### Patient dashboard

Current state: **protected placeholder dashboard**

Implemented now:

- role protection via `requireRole("patient")`
- shared top navigation
- welcome area using the authenticated user name

Missing today:

- medicine search
- appointments list
- upcoming appointment card
- medical records history
- prescriptions view

### Doctor dashboard

Current state: **protected placeholder dashboard**

Implemented now:

- role protection via `requireRole("doctor")`
- shared top navigation
- welcome area

Missing today:

- patient list
- appointment queue
- patient dossier access
- record creation/editing
- prescription authoring

### Pharmacist dashboard

Current state: **protected placeholder dashboard**

Implemented now:

- role protection via `requireRole("pharmacist")`
- shared top navigation
- welcome area

Missing today:

- stock table
- medicine availability controls
- low-stock views
- duty-pharmacy controls
- pricing updates

### Hospital administrator dashboard

Current state: **the most advanced domain dashboard in the app right now**

Implemented now:

- role protection via `requireRole("hospital_admin")`
- shared top navigation
- hospital lookup from the database
- display of the admin’s institution
- doctor count for the admin’s hospital
- navigation into doctor management

This is the only dashboard that already goes beyond a simple welcome screen.

---

## 4.5 Hospital Admin Doctor Management

This is currently the most complete business feature in the repository.

### What works today

Hospital admins can:

- open `/hospital-admin/doctors`
- see the doctors linked to their hospital
- view doctor name, email, specialty, and creation date
- create a new doctor account using a dialog form

### Doctor creation flow

The add-doctor flow already includes:

- server-side role protection
- hospital scoping to the current admin’s institution
- form validation with Zod
- unique email check
- bcrypt password hashing
- doctor role assignment
- storage of `createdBy` to record who created the doctor
- immediate success feedback showing the login email and temporary password

### Specialty support

The UI already offers a specialty selector with a curated list, including:

- General medicine
- Cardiology
- Dermatology
- Gynecology
- Neurology
- Ophthalmology
- Orthopedics
- Pediatrics
- Psychiatry
- Radiology
- Urology

### What is still missing

The doctor management module does **not** yet include:

- doctor profile editing
- password reset flow
- doctor deactivation/removal
- pagination or search
- filtering by specialty
- invitation emails or notifications

Still, this module is a strong proof that the app already supports **real role-scoped admin operations**.

---

## 5. Data Model: What the App Is Already Designed to Support

The database schema is much broader than the current UI.

This is important because it shows the app is not just a login demo: the main product domains are already modeled.

### Core entities already defined

#### Hospitals

Stored fields include:

- name
- type (`public`, `private`, `chu`)
- latitude / longitude
- address
- phone
- specialties

#### Pharmacies

Stored fields include:

- name
- latitude / longitude
- address
- neighborhood
- on-duty status
- opening hours

#### Users

Stored fields include:

- email
- hashed password
- role
- full name
- phone
- specialty
- hospital link
- pharmacy link
- creator admin link
- creation timestamp

#### Medicines

Stored fields include:

- medicine code/id
- commercial name
- active ingredient
- dosage form
- price metadata (`ppm`)
- generic flag

#### Pharmacy stock

Stored fields include:

- pharmacy reference
- medicine reference
- quantity
- price
- last updated timestamp

#### Appointments

Stored fields include:

- patient
- doctor
- hospital
- appointment datetime
- status (`scheduled`, `completed`, `cancelled`)
- reason
- creation timestamp

#### Medical records

Stored fields include:

- patient
- doctor
- optional appointment link
- consultation date
- diagnosis
- notes
- structured prescription array
- creation timestamp

### Practical meaning of the schema

Even though the UI is not there yet, the schema already supports:

- medicine discovery and comparison,
- pharmacy stock lookup,
- appointment booking/history,
- doctor-patient relationships,
- medical record timelines,
- prescriptions attached to consultations,
- hospital-scoped staff management.

This is one of the clearest signs that the app is currently in a **foundation-complete, feature-surface-incomplete** stage.

---

## 6. Seed Data and Demo Content

The demo/seed setup is one of the strongest assets of the project.

### Seeded reference data

The seed script currently loads:

- **5 hospitals** from Tangier-focused JSON data
- **158 pharmacies** from Tangier-focused JSON data
- **49 medicines** selected from the CSV medicine source

### Seeded stock coverage

The seed script generates a full pharmacy/medicine stock matrix:

- **7,742 stock rows** (`158 pharmacies x 49 medicines`)
- includes normal stock, low stock, and out-of-stock cases
- guarantees that **Doliprane** is available in at least one Centre-ville pharmacy for demo purposes

### Seeded user accounts

The seed creates **6 users** in total.

The main demo accounts are:

- `admin@locatomed.ma` → hospital admin
- `fatima@locatomed.ma` → patient
- `benjelloun@locatomed.ma` → doctor
- `ahmed@locatomed.ma` → pharmacist

Shared demo password for those headline accounts:

- `demo123`

Additional seeded doctors also exist for richer relational data.

### Seeded care journey data

The seed also creates a believable patient history for demo purposes:

- **3 completed historical appointments**
- **3 medical records** linked to those consultations
- **1 upcoming scheduled appointment** for the patient demo account

This is significant because it means the app already has a realistic demo narrative ready for future UI work.

---

## 7. Localization and Language State

Current language state:

- the actual UI is primarily **French**,
- `lib/i18n/fr.ts` exists but is empty,
- `lib/i18n/ar.ts` exists but is empty.

So the app is **French-first today**, with clear intention to support Arabic later, but no real i18n system is wired yet.

---

## 8. What Is Clearly Missing Right Now

To be very direct: the app is **not yet feature-complete from an end-user healthcare perspective**.

The biggest current gaps are:

### For patients

- no medicine search page
- no pharmacy map
- no medicine availability results page
- no appointment booking form
- no appointment history UI
- no record timeline UI

### For doctors

- no consultation workspace
- no patient medical file UI
- no record-writing workflow
- no prescription creation UI

### For pharmacists

- no stock management dashboard
- no medicine inventory editor
- no low-stock management tools
- no duty status management controls

### For hospital administrators

- no doctor editing/removal
- no broader staff management
- no hospital profile management

### Product/platform gaps

- no tests are present in the repository
- no analytics or reporting layer is visible
- no notifications/email workflows are visible
- no audit or activity log UI exists
- no production deployment documentation exists yet

---

## 9. Upcoming Work — Best Inference From the Codebase

This section is intentionally careful.

These are the most likely upcoming features because they are supported by the schema, seed data, dependencies, and project scaffold — but they are **not yet shipped**.

## 9.1 High-confidence upcoming features

### Medicine search and availability lookup

Why this looks imminent:

- medicines, pharmacies, and pharmacy stock are already modeled,
- the seed script explicitly guarantees demo search conditions for Doliprane,
- the project README/scaffold labels medicine search as the hero feature,
- `leaflet` and `react-leaflet` are installed, suggesting a map-based result flow.

Expected future experience:

- search medicine by name or active ingredient,
- see pharmacies that stock it,
- filter by stock status or duty pharmacy,
- likely show results on a Tangier map.

### Appointment booking and scheduling

Why this looks imminent:

- appointments already have a complete table and relationships,
- the seed script creates both historical and upcoming appointments,
- patient and doctor roles are already separated correctly.

Expected future experience:

- patients book appointments with doctors,
- doctors view upcoming appointments,
- appointment statuses move through scheduled/completed/cancelled.

### Medical folder / patient record experience

Why this looks imminent:

- medical records already exist in the schema,
- prescriptions are already structured in the database,
- the seed script creates real medical history entries for the patient demo account.

Expected future experience:

- patients view their consultation history,
- doctors add diagnoses, notes, and prescriptions,
- records link back to appointments.

### Pharmacy stock management

Why this looks imminent:

- stock tables are already modeled,
- pharmacist accounts already exist,
- the seed populates a large stock matrix,
- the pharmacy portal already exists, even if its dashboard is still empty.

Expected future experience:

- pharmacists update quantities and prices,
- out-of-stock and low-stock items become visible,
- availability can feed the medicine search feature.

## 9.2 Medium-confidence upcoming improvements

### Richer dashboards for every role

The current placeholder dashboards strongly suggest the next phase will be to add real cards, tables, and activity summaries for:

- patients,
- doctors,
- pharmacists.

### Arabic language support

The presence of `fr.ts` and `ar.ts` suggests bilingual support is intended, but the implementation has not started in a meaningful way.

### More polished admin operations

Hospital admin management will likely grow toward:

- editing doctors,
- disabling accounts,
- viewing more staff information,
- better hospital-level management tools.

---

## 10. Current Maturity Assessment

If we summarize the project honestly:

### What is mature already

- authentication structure
- role separation
- route protection
- local persistence model
- seeded demo realism
- admin-to-doctor creation flow

### What is still in prototype form

- most dashboards
- all patient health workflows
- all doctor medical workflows
- all pharmacist inventory workflows
- search/map experiences
- localization

### Best one-line assessment

**LOCATOMED is currently a strong multi-role healthcare platform foundation with working auth and one meaningful admin workflow, but the main patient/doctor/pharmacy product experiences are still upcoming.**

---

## 11. Suggested Priorities for the Next Development Phase

If the goal is to make the app feel substantially more complete quickly, the best next sequence appears to be:

1. **Medicine search + pharmacy availability**
2. **Patient appointment booking/history**
3. **Doctor consultation + medical record UI**
4. **Pharmacist stock management UI**
5. **Arabic localization and overall polish**

This order would unlock the app’s most visible value while reusing the data structures that already exist.

---

## 12. Final Summary

Today, LOCATOMED already has:

- a clear product direction,
- a good technical foundation,
- a realistic health data model,
- strong role-aware auth,
- a seeded Tangier demo environment,
- and one real administrative workflow.

What it does **not** yet have is the full user-facing healthcare experience promised by the schema and data model.

So the current state is best described as:

**foundation built, core portals live, admin workflow started, major health features next.**
