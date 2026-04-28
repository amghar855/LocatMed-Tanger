---
name: demo-flow
description: Verifies the end-to-end LOCATOMED hero narrative (set in Tangier) works click-by-click before any demo or deploy. USE THIS SKILL whenever the user mentions demo, rehearsal, deploy, presentation, pitch, judges, or says "let's test the flow". RUN THIS before every Vercel deploy.
---

# Demo flow verification

## The narrative (do not break)

Fatima (patient in Tangier) has a migraine →
searches "paracetamol" →
sees which nearby Tangier pharmacy has Doliprane in stock →
books same-week appointment with Dr. Benjelloun at Hôpital Mohammed V →
Dr. Benjelloun opens his dashboard, sees Fatima's folder →
adds a consultation entry after the "visit" →
Fatima refreshes her folder → sees the new entry.

## Demo credentials (must always work after a seed)

```
Patient:     fatima@locatomed.ma      / demo123
Doctor:      benjelloun@locatomed.ma  / demo123   (Hôpital Mohammed V, Tanger)
Pharmacist:  ahmed@locatomed.ma       / demo123   (Pharmacie Al Andalous)
```

## Manual rehearsal checklist (mandatory before every deploy)

1. **Fresh browser**, clear cookies, landing page loads
2. **Log in as Fatima** → lands on `/patient` dashboard
3. Go to search → type "doli" → "Doliprane 1000mg" appears in results within 500ms
4. Expand Doliprane → at least one Tangier pharmacy shows "En stock" with a quantity
5. Map shows pharmacy pins centered on Tangier, at least one visible
6. Filter or navigate → Hôpitaux list shows Hôpital Mohammed V among others
7. Click Hôpital Mohammed V → Dr. Benjelloun visible → click him → slot grid loads
8. Book a slot tomorrow at 10:00 → toast "Rendez-vous confirmé"
9. Back to `/patient` → upcoming appointment visible with hospital name
10. **Log out**, log in as **benjelloun@locatomed.ma**
11. Doctor dashboard shows Fatima's appointment at Hôpital Mohammed V
12. Click patient name → folder loads with historical entries
13. Click "Start consultation" → add diagnosis + notes → submit
14. Toast "Consultation enregistrée"
15. **Log out**, log in as **Fatima** again
16. Open folder → new entry appears at the top
17. **Log out**, log in as **ahmed@locatomed.ma**
18. Stock table loads with medicines including Doliprane
19. Edit one quantity inline → save → toast "Stock mis à jour"
20. Reload page → new quantity persists

**If any step fails, DO NOT DEPLOY. Fix first.**

## Automated smoke test (optional but recommended)

`tests/e2e/demo-flow.spec.ts` — Playwright walking the hero flow.
Run with `npm run test:demo`. Must pass before pushing to main.

## Deployment checklist

- [ ] Manual rehearsal above passes on localhost
- [ ] Run `npm run db:seed` once more for a clean state
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] `npm run lint` passes
- [ ] Vercel preview URL deployed and accessible
- [ ] **Repeat manual rehearsal on the preview URL**, not just localhost
- [ ] Screen-record the full flow as a backup video (1-2 min)

## Tangier-specific sanity checks

- [ ] Map center is Tangier (35.7673, -5.7998), not Casablanca or Rabat
- [ ] All pharmacy pins fall inside the Tangier bounding box
- [ ] All 5 hospitals are seeded with real Tangier addresses
- [ ] At least one pharmacy in central Tangier (Medina / Iberia) has Doliprane
- [ ] Doctor profile shows their hospital name in Tangier, not a generic clinic

## Pitfalls
- Seed data resets may break logged-in sessions — always log out first
- Deploy preview has different env (Turso vs local SQLite) — test there too
- Leaflet map requires internet for OSM tiles — verify presentation WiFi
- Cold starts on Vercel are slow — warm up the demo URL 30s before pitching
- Do the rehearsal on the actual device you'll demo on, including resolution
- If demo is on a borrowed laptop, log in and save credentials beforehand
- Check the date format shows French ("mardi 18 avril") not US format
