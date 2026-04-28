---
name: seed-data
description: Generates or updates demo seed data for LOCATOMED using Drizzle and real Tangier sources (data.gov.ma medicines, OSM pharmacies, curated Tangier hospitals, fake doctors and patients). USE THIS SKILL whenever the user mentions seed, demo data, fixtures, sample data, or when preparing for the demo rehearsal.
---

# Seeding LOCATOMED with realistic Tangier data

## Geographic scope
All locations are in **Tangier**:
- Center: lat `35.7673`, lng `-5.7998`
- Bounding box: `35.70–35.82 N`, `-5.92 to -5.68 W`
- Neighborhoods: Medina, Malabata, Branes, Gzinaya, Iberia, Beni Makada,
  Mesnana, Charf, Val Fleuri, Souani, Ziaten

## Sources

### Medicines
`data/medicaments.csv` — extracted from data.gov.ma "Référentiel des
médicaments". Keep ~50 common drugs: Doliprane, Efferalgan, Dafalgan,
Augmentin, Amoxicilline, Ventoline, Spasfon, Smecta, Imodium, Gaviscon,
Maalox, Voltarène, Aspirine, Ibuprofène, etc.

### Pharmacies
`data/pharmacies-tanger.json` — from Overpass API. Run this query **once**,
save the JSON, commit it. Don't hit the API on every seed.

```overpass
[out:json][timeout:25];
(
  node["amenity"="pharmacy"](35.70,-5.92,35.82,-5.68);
  way["amenity"="pharmacy"](35.70,-5.92,35.82,-5.68);
);
out center;
```

POST to `https://overpass-api.de/api/interpreter`. Aim for 30–60 results.
Augment entries missing `name` with plausible names (Pharmacie Al Andalous,
Pharmacie du Détroit, Pharmacie Ibn Batouta, Pharmacie Malabata, etc.).

### Hospitals
`data/hospitals-tanger.json` — curated list, committed to the repo:

```json
[
  {
    "name": "CHU Mohammed VI",
    "type": "chu",
    "lat": 35.7294,
    "lng": -5.8419,
    "address": "Route de Rabat Km 17, Gzinaya, Tanger",
    "specialties": ["chirurgie", "médecine interne", "pédiatrie", "oncologie", "psychiatrie"]
  },
  {
    "name": "Hôpital Mohammed V",
    "type": "public",
    "lat": 35.7635,
    "lng": -5.8070,
    "address": "Boulevard Moulay Rachid, Tanger",
    "specialties": ["chirurgie", "maternité", "pédiatrie", "dialyse", "urgences"]
  },
  {
    "name": "Hôpital Privé de Tanger",
    "type": "private",
    "lat": 35.7602,
    "lng": -5.8139,
    "address": "Avenue Moulay Rachid, 90050 Tanger",
    "specialties": ["cardiologie", "réanimation", "chirurgie", "néonatalogie"]
  },
  {
    "name": "Hôpital Duc de Tovar",
    "type": "public",
    "lat": 35.7716,
    "lng": -5.8014,
    "address": "Tanger",
    "specialties": ["médecine générale", "réanimation médicale"]
  },
  {
    "name": "Hôpital Universitaire Mère Enfant Mohammed VI",
    "type": "chu",
    "lat": 35.7300,
    "lng": -5.8400,
    "address": "Gzinaya, Tanger",
    "specialties": ["pédiatrie", "gynécologie", "obstétrique"]
  }
]
```

Verify coordinates on OpenStreetMap before demo. Approximations are fine
for hackathon.

### Doctors and patients
Hardcoded in `scripts/seed.ts` with plausible Tangier-region names:
Benjelloun, El Fassi, Alaoui, Tazi, Bennani, Kettani, Lahlou, Sqalli.

## Running

```bash
npm run db:seed
```

Script drops all tables, re-runs migrations, inserts fixtures. Uses a fixed
random seed so the demo is reproducible.

## Seed script structure (`scripts/seed.ts`)

```typescript
import { db } from "@/lib/db";
import {
  users, hospitals, pharmacies, medicines, pharmacyStock,
  appointments, medicalRecords
} from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";

async function seed() {
  // Safety: never run against prod
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production");
  }

  // 1. wipe — delete in reverse dependency order
  await db.delete(medicalRecords);
  await db.delete(appointments);
  await db.delete(pharmacyStock);
  await db.delete(users);
  await db.delete(hospitals);
  await db.delete(pharmacies);
  await db.delete(medicines);

  // 2. insert hospitals from data/hospitals-tanger.json
  // 3. insert pharmacies from data/pharmacies-tanger.json (assign neighborhood)
  // 4. insert medicines from data/medicaments.csv
  // 5. insert fake users (hash passwords with bcrypt)
  //    - Fatima Zahra (patient) — the demo hero
  //    - Amine Benjelloun (doctor, généraliste @ Hôpital Mohammed V)
  //    - Khadija El Fassi (doctor, pédiatre @ CHU Mohammed VI)
  //    - Youssef Tazi (doctor, cardiologue @ Hôpital Privé de Tanger)
  //    - Ahmed Bennani (pharmacist @ Pharmacie Al Andalous)
  // 6. insert stock rows for every (pharmacy, medicine) pair
  //    - ~15% at quantity=0 (out of stock)
  //    - ~10% at quantity<5 (low stock)
  // 7. insert 3-5 historical appointments + medical records for Fatima
  //    - 6 months ago at Hôpital Mohammed V: "Rhinite allergique saisonnière"
  //    - 2 months ago at CHU Mohammed VI: "Contrôle tension artérielle"
  // 8. insert 1 upcoming appointment (tomorrow) so doctor dashboard isn't empty
}

seed().then(() => {
  console.log("✓ Seed complete");
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## Required invariants after seeding
- Demo user `fatima@locatomed.ma` / `demo123` exists with medical history
- Demo doctor `benjelloun@locatomed.ma` / `demo123` linked to Hôpital Mohammed V,
  specialty = "Médecine générale"
- Demo pharmacist `ahmed@locatomed.ma` / `demo123` linked to one Tangier pharmacy
- 5 hospitals total (at least 2 public, 1 CHU, 1 private)
- 30+ pharmacies across Tangier bounding box
- Stock rows for every (pharmacy, medicine) pair, ~15% at quantity=0
- **At least one pharmacy in central Tangier must stock "Doliprane" with
  quantity > 0** — this is the demo search
- At least 2 pharmacies have `isOnDuty = true`

## Pitfalls
- Wipe order matters — delete child tables before parents or FK errors fire
- Always hash seed passwords with bcrypt — never store plaintext
- Don't run against Turso prod by accident — guard with NODE_ENV check
- Keep seed deterministic — use a seeded PRNG like `seedrandom`
- Some OSM pharmacies have no `name` — fabricate plausible Tangier names
- Coordinates from OSM may be slightly off — fine for MVP, don't obsess
- Don't accidentally use Casablanca coordinates — we are in Tangier
