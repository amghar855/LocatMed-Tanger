---
title: LOCATOMED Frontend & UI/UX Engineering
applyTo:
  -"app/**/*.tsx"
  - "components/**/*.tsx"
  - "lib/i18n/*.ts"
  - "docs/**/*.md"
description: |
  Persistent instructions for frontend/UI/UX work on the LOCATOMED project. Enforces visual identity, UI system, dashboard structure, responsiveness, and documentation standards for all features and pages. Applies to all frontend code, UI components, layouts, and documentation files.

# 🎨 Visual Identity
- Use ONLY the LOCATOMED palette:
  - Primary: #2E5077
  - Secondary: #4DA1A9
  - Accent: #79D7BE
  - Background: #F6F4F0
- Apply these colors to all UI elements, actions, and backgrounds.

# 🧩 UI System
- Use ONLY shadcn/ui components for all UI (Button, Card, Dialog, etc.).
- Do NOT mix custom or random styles. No CSS modules.
- Compose new UI only by combining shadcn primitives.

# 📊 Dashboard Rule
- All dashboards (patient, pharmacy, hospital) must use shadcn dashboard templates (dashboard-01 or similar), adapted to LOCATOMED colors.
- Dashboards must include: sidebar (desktop), mobile nav (sheet/drawer), header, summary cards, main content area.

# 📱 Responsive Design
- Mobile-first, must work on phone, tablet, desktop.
- Use vertical stacking on mobile, replace tables with cards, use sheet/drawer for nav.
- Ensure touch-friendly UI.

# 🎯 UX Principles
- Simple, clean, calm, fast.
- Clear actions, minimal steps, readable UI.
- Avoid clutter, confusing layouts, too many colors.

# 🧱 Component Rules
- Cards: clean, spaced, not crowded.
- Buttons: Primary (#2E5077), Secondary (#4DA1A9), Accent (#79D7BE).
- Badges: Use for status (pending, confirmed, available, etc.).
- Tables: desktop only; mobile = cards.

# 🧭 Navigation
- Simple, role-based, clear active state, no deep nesting, easy mobile access.

# ✨ Interactions
- Hover states, skeleton loaders, smooth transitions, no heavy animations.

# 📄 Page Standard
- Every page: header, content, actions, loading state, empty state, responsive layout.

# 📚 Documentation (MANDATORY)
- For EVERY feature/page/major change, create a markdown file in /docs/ (see structure in prompt).
- Each doc must include: Title, Description, UI Details, Files Created/Modified, Logic Overview, Issues/Errors, Notes.
- NEVER skip documentation.
- Write docs as if explaining to a teammate.

# 🧠 Workflow
1. Explain what you will build
2. Generate the UI code
3. Ensure responsiveness
4. Apply LOCATOMED design
5. THEN generate documentation file

# 🏁 Final Priority
- UI must look like a real startup, be consistent, fully responsive, and demo-ready.
- Documentation must be complete, structured, and useful for the team.
- Do NOT generate unfinished UI. Do NOT skip documentation.
