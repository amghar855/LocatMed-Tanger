---
name: medicine-search
description: Builds or modifies the medicine search experience — the LOCATOMED hero feature. Combines medicine lookup with real-time pharmacy availability and map view, centered on Tangier. USE THIS SKILL whenever the user mentions medicine search, pharmacy availability, stock lookup, drug search, or "find a medicine".
---

# Medicine search + pharmacy availability

## Why this matters
This is the demo's hero feature. It's the first thing judges see. Polish
matters more here than anywhere else.

## UX contract

Input (with debounce) → list of matching medicines showing name, active
ingredient, dosage form, PPM price → user expands a medicine → list of
pharmacies stocking it, sorted by stock status then distance. Each pharmacy
row shows:
- Pharmacy name
- Neighborhood (Medina, Malabata, Branes, etc.)
- Distance from user (Haversine from geolocation or fallback Tangier center)
- Quantity badge: green (>5), orange (1-5), red (0)
- "De garde" badge if `isOnDuty = true`
- Price in MAD

Map on the right (or below on mobile) with Leaflet pins centered on Tangier.
Clicking a pharmacy in the list centers the map on it. Clicking a pin
highlights the list row.

## Geolocation fallback

```typescript
export const TANGIER_CENTER = { lat: 35.7673, lng: -5.7998 };

export function useUserLocation() {
  const [loc, setLoc] = useState(TANGIER_CENTER);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silent fallback to Tangier center
      { timeout: 3000 },
    );
  }, []);
  return loc;
}
```

## Query pattern (one JOIN, not N+1)

```typescript
// lib/db/queries/medicines.ts
export async function searchMedicinesWithAvailability(query: string) {
  const like = `%${query}%`;
  return db
    .select({
      medicine: medicines,
      stock: pharmacyStock,
      pharmacy: pharmacies,
    })
    .from(medicines)
    .leftJoin(pharmacyStock, eq(pharmacyStock.medicineId, medicines.id))
    .leftJoin(pharmacies, eq(pharmacies.id, pharmacyStock.pharmacyId))
    .where(
      or(
        ilike(medicines.name, like),
        ilike(medicines.activeIngredient, like),
      )
    )
    .orderBy(desc(pharmacyStock.quantity));
}
```

SQLite doesn't have `ilike` — use `LIKE` with `LOWER()` on both sides, or
`COLLATE NOCASE`. Example:
```typescript
.where(sql`lower(${medicines.name}) LIKE lower(${like})`)
```

Then group by medicine in application code for display.

## Server action

```typescript
// app/patient/search/actions.ts
"use server";
import { requireRole } from "@/lib/auth/guards";
import { searchMedicinesWithAvailability } from "@/lib/db/queries/medicines";
import { z } from "zod";

const SearchInput = z.object({
  query: z.string().min(2).max(100),
});

export async function searchMedicines(input: z.infer<typeof SearchInput>) {
  await requireRole("patient");
  const { query } = SearchInput.parse(input);
  return searchMedicinesWithAvailability(query);
}
```

## Map setup (Tangier-centric)

```typescript
<MapContainer
  center={[35.7673, -5.7998]}           // Tangier
  zoom={12}
  maxBounds={[[35.68, -5.95], [35.85, -5.65]]}   // soft clamp to Tangier area
  style={{ height: "600px", width: "100%" }}
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution="© OpenStreetMap"
  />
  {pharmacies.map(p => <Marker key={p.id} position={[p.lat, p.lng]} ...
</MapContainer>
```

## Leaflet SSR gotcha

Next.js SSR breaks Leaflet because it expects `window`. Dynamic-import the
map component with `ssr: false`:

```typescript
import dynamic from "next/dynamic";
const PharmacyMap = dynamic(
  () => import("@/components/locatomed/medicine-search/pharmacy-map"),
  { ssr: false }
);
```

Also import `leaflet/dist/leaflet.css` in the root layout.

## Must-have polish

- Debounce input 300ms (use `useDebouncedValue`)
- "Out of stock" in red, "Low stock (<5)" in orange, in stock green
- Empty state with suggested searches: Doliprane, Ventoline, Augmentin, Spasfon
- Loading skeleton during search
- Custom pin color per stock status
- Mobile: map collapses below list, or a toggle between list/map views

## Pitfalls
- Don't fetch medicine and stock separately — one query, group in JS
- Distance is Haversine — good enough for MVP, don't install a routing library
- Mobile: map goes below list, not beside
- **Never hardcode Casablanca coords** — always use `TANGIER_CENTER`
- Don't query on every keystroke — debounce
- Case-insensitive search in SQLite needs `COLLATE NOCASE` or `LOWER()` —
  `ilike` is PostgreSQL-only
