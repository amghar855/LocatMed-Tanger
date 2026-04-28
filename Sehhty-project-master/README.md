# LOCATOMED — Claude Code Scaffold (Tangier edition)

This bundle contains the `CLAUDE.md` and `.claude/skills/` setup for the
LOCATOMED hackathon project, scoped to **Tangier, Morocco**. Drop it into
your repo root and Claude Code will pick everything up on the next session.

## What's inside

```
.
├── CLAUDE.md                          # Project constitution (always loaded)
└── .claude/
    └── skills/
        ├── scaffold-feature/          # Add a feature end-to-end (DB→API→UI)
        ├── authorization/             # CRITICAL — auth checks in server actions
        ├── auth-roles/                # Auth.js v5 setup + role routing
        ├── drizzle-schema/            # Schema changes + migrations
        ├── seed-data/                 # Demo data from Moroccan sources
        ├── medicine-search/           # The hero feature
        ├── appointment-booking/       # Patient↔doctor scheduling
        ├── medical-folder/            # Patient records + doctor updates
        ├── pharmacy-stock/            # Pharmacist stock management
        └── demo-flow/                 # Pre-deploy rehearsal checklist
```

## How to install

1. Extract this bundle into the root of your LOCATOMED repo:
   ```
   unzip locatomed-scaffold.zip -d .
   ```
2. Commit:
   ```
   git add CLAUDE.md .claude/
   git commit -m "Add Claude Code scaffold"
   ```
3. Start Claude Code from the repo root:
   ```
   cd locatomed
   claude
   ```
   CLAUDE.md loads automatically. Skills are discovered on demand.

## How skills get triggered

Two ways:

**Automatic** — Claude reads skill descriptions at startup and auto-loads
the relevant skill when you ask about that topic. The descriptions are
written to be slightly "pushy" so this works reliably.

**Explicit** — type the skill name with a slash, e.g.:
```
/scaffold-feature add a prescriptions feature
/supabase-rls                        (won't work, we use SQLite — see /authorization instead)
/authorization review the new stock action
/demo-flow                           (before every deploy)
```

## Editing these files

Skills are just markdown. Edit them freely as your project evolves. Two rules:

1. Keep descriptions "pushy" enough to trigger — mention keywords users will
   actually type, and use phrases like "USE THIS SKILL whenever...".
2. If CLAUDE.md grows past ~250 lines, move sections into skills or into
   `docs/` and reference them there.

## The cardinal rule

With SQLite (no RLS), the `authorization` skill is your single source of
truth for access control. Every server action MUST start with `requireRole()`
and scope every query. Read that skill top-to-bottom before writing any
server action.

Good luck with the hackathon. 🚀
