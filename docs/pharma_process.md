# Discover Feature — Detailed Process Documentation

## Overview

The Discover feature (`/patient/discover`) is a full-screen, map-first interface that lets a patient explore **hospitals** and **pharmacies** in Tangier. It combines server-side data fetching, real-time geolocation, client-side filtering, auto-radius management, and OSRM road routing — all without any paid API key.

---

## Architecture

```
app/patient/discover/page.tsx          ← Server Component (auth, data fetch, URL params)
  └── DiscoverClient                   ← Client Component (all interactivity)
        ├── DiscoverMapLeaflet         ← Leaflet map (dynamic import, SSR disabled)
        └── SidebarDrawerContent      ← Navigation drawer (hamburger menu)

features/patient/services/discover/index.ts   ← All DB queries
features/patient/types/discover/index.ts      ← HospitalDiscover, PharmacyDiscover
features/patient/utils/distance.ts            ← Haversine formula + formatter
```

---

## 1. Server Side — `page.tsx`

### URL Parameters

The page reads the following query string parameters:

| Param      | Values                          | Default       |
|------------|---------------------------------|---------------|
| `view`     | `hospitals` \| `pharmacies`     | `hospitals`   |
| `type`     | `public` \| `private` \| `chu`  | `""` (all)    |
| `pharmacy` | `on-duty` \| `all`              | `all`         |
| `radius`   | `2–50` (km, integer)            | `0` (auto)    |
| `q`        | any string                      | `""`          |

All params are validated and sanitized before use (invalid values fall back to safe defaults).

### Data Fetching

Three queries run in parallel via `Promise.all`:

1. **`getHospitalsForDiscover({ type })`** — returns all hospitals, optionally filtered by type. Ordered by name.
2. **`getPharmaciesForDiscover({ medicineQuery })`** — returns all pharmacies with their in-stock medicine names. The `medicineQuery` is only applied when `view === "pharmacies"` (for server-side pre-filtering). Ordered by pharmacy name.
3. **`getDiscoverMedicineNames()`** — returns all distinct medicine names that have at least one unit in stock across any pharmacy. Used to power the autocomplete dropdown independently of the current search.

The server passes these as props to `DiscoverClient`, so the initial page render is data-complete with no client-side loading state.

---

## 2. Database Queries — `discover/index.ts`

### `getHospitalsForDiscover`

```
hospitals table
  WHERE type = ? (optional)
  ORDER BY name
```

Optionally filters by `specialty` using a JSON `EXISTS` subquery over `hospitals.specialties` (JSON array stored in SQLite).

### `getPharmaciesForDiscover`

Two-step query:

**Step 1** — fetch all pharmacies (no filter):
```
pharmacies table
  ORDER BY name
```

**Step 2** — fetch stock availability (medicines with quantity > 0):
```
pharmacyStock
  INNER JOIN pharmacies ON pharmacyId
  INNER JOIN medicines ON medicineId
  WHERE quantity > 0
    AND (name LIKE %query% OR activeIngredient LIKE %query%)  ← only when query provided
  ORDER BY medicine name
```

**Post-processing** — group stock rows by `pharmacyId` into a `Map`, then attach `availableMedicines[]` and `availableIngredients[]` to each pharmacy row. Pharmacies with no matching stock get empty arrays.

### `getDiscoverMedicineNames`

```
medicines
  INNER JOIN pharmacyStock ON medicineId
  WHERE quantity > 0
  SELECT DISTINCT name
  ORDER BY name
```

Returns a flat `string[]` of medicine names — the full in-stock catalogue, used for the autocomplete dropdown.

---

## 3. Client Side — `DiscoverClient`

### State

| State                  | Type                          | Purpose                                              |
|------------------------|-------------------------------|------------------------------------------------------|
| `localQuery`           | `string`                      | Live search input (not yet committed)                |
| `committedQuery`       | `string`                      | Confirmed query (triggers auto-select logic)         |
| `suggestionsOpen`      | `boolean`                     | Controls autocomplete dropdown visibility            |
| `typeOpen`             | `boolean`                     | Hospital type dropdown visibility                    |
| `pharmacyFilterOpen`   | `boolean`                     | Pharmacy duty-filter dropdown visibility             |
| `radiusOpen`           | `boolean`                     | Radius selector dropdown visibility                  |
| `localPharmacyFilter`  | `"all" \| "on-duty"`          | Active pharmacy duty filter                          |
| `localRadiusKm`        | `number`                      | Manually set radius (0 = auto)                       |
| `userLocation`         | `{ lat, lng }`                | GPS coordinates, falls back to Tangier center        |
| `locationAccuracyM`    | `number \| null`              | GPS accuracy in metres (shown in status badge)       |
| `locationSource`       | `"fallback" \| "device"`      | Whether GPS is real or default Tangier center        |
| `locationDenied`       | `boolean`                     | True if user denied geolocation permission           |
| `directionTarget`      | `{ lat, lng } \| null`        | Destination for OSRM road route rendering            |
| `selectedId`           | `string \| null`              | ID of the selected hospital or pharmacy              |
| `menuOpen`             | `boolean`                     | Navigation drawer open/closed                        |
| `dragY` / `startY`     | `number`                      | Touch drag state for bottom sheet dismiss gesture    |

### Geolocation

On mount, the component:
1. Calls `navigator.geolocation.getCurrentPosition` for a fast initial fix.
2. Starts `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`, `timeout: 10s`, `maximumAge: 5s` for continuous updates.
3. Sets `locationSource = "device"` when a real GPS fix arrives.
4. Sets `locationDenied = true` on `PERMISSION_DENIED` error.
5. Falls back to Tangier center (`35.7673, -5.7998`) if geolocation is unavailable or denied.

A `userLocationRef` ref mirrors the state value so the auto-select `useEffect` can read the latest location without being added to its dependency array (avoids re-running on every GPS update).

### Medicine Autocomplete

Suggestions are computed client-side from `allMedicineNames` (server-fetched full catalogue):
- Only shown in `pharmacies` view.
- Filters by substring match (case-insensitive) against `localQuery`.
- Limited to 8 results.
- Rendered as a dropdown below the search bar; `onMouseDown` with `preventDefault` captures the click before the input `onBlur` fires.

Committing a suggestion calls `applySuggestion(name)` which:
1. Sets `localQuery` and `committedQuery` to the name.
2. Closes the dropdown.
3. Resets `selectedId` to `null`.
4. Pushes a new URL with `?q=name` via `router.push`.

Submitting the form (`handleSearch`) does the same for free-text input.

### Filtering Logic

#### Hospitals

```
filteredHospitals = hospitals
  .filter(h => nameOrAddress matches localQuery)
  .filter(h => distance(user, h) <= localRadiusKm)   // skipped when radius = 0
```

#### Pharmacies

**Step 1 — duty filter:**
```
pharmaciesMatchingQuery = pharmacies
  .filter(p => if localPharmacyFilter === "on-duty": p.isOnDuty)
```

**Step 2 — compute distance + sort:**
```
pharmaciesWithDistance = pharmaciesMatchingQuery
  .map(p => ({ ...p, distanceKm: haversine(user, p) }))
  .sort(on-duty first, then by distance ascending)
```

**Step 3 — auto-radius:**

When `localRadiusKm === 0` (auto mode), `autoRadiusKm` is computed:
- Steps through `[1, 2, 5, 10, 15, 20]` km.
- Returns the first step where at least one pharmacy exists within it.
- Falls back to `ceil(nearest pharmacy distance)`.

`effectivePharmacyRadiusKm` = `localRadiusKm > 0 ? localRadiusKm : autoRadiusKm`

**Step 4 — apply radius:**
```
visiblePharmacies = pharmaciesWithDistance
  .filter(p => p.distanceKm <= effectivePharmacyRadiusKm)
```

### Auto-Select Best Pharmacy

When `committedQuery` changes (and view is `pharmacies`), a `useEffect` automatically selects the best pharmacy:

```
best = pharmacies with matching medicine
  .sort(on-duty first, then by distance)
  [0]
```

This triggers the route line to draw automatically.

### Nearest Qualified Pharmacy Badge

`nearestQualifiedPharmacy` = first `visiblePharmacy` that:
- `isOnDuty === true`
- Has the committed query medicine in `availableMedicines`

Shown as a tappable pill badge on the map overlay when no card is open.

### URL Navigation

`navigate(params)` merges the current state with overrides and calls `router.push` with a new `?view=…&type=…&pharmacy=…&radius=…&q=…` URL. This keeps all filter state in the URL so the page is shareable and reloadable with the same view.

---

## 4. Map — `DiscoverMapLeaflet`

Built with **react-leaflet** on **OpenStreetMap / CartoDB Light** tiles. No API key required.

### Map Controllers (inner components)

| Component            | Behavior                                                                 |
|----------------------|--------------------------------------------------------------------------|
| `FlyToSelection`     | `map.flyTo` to selected marker at zoom ≥ 15, 1.5s animation             |
| `ZoomOnRadius`       | `map.setView` on user location at zoom derived from radius (when no selection) |
| `SyncRadiusOnZoom`   | On `zoomend`, computes matching radius km and calls `onZoomRadiusChange` |

**Zoom ↔ Radius mapping:**

| Zoom | Radius |
|------|--------|
| ≥ 14 | 2 km   |
| ≥ 13 | 5 km   |
| ≥ 12 | 10 km  |
| ≥ 11 | 15 km  |
| < 11 | 20 km  |

This creates a two-way sync: moving the radius selector zooms the map, and zooming the map updates the radius selector.

### OSRM Road Routing

When `directionTarget` is set (non-null), the map fetches a real road route:

```
GET https://router.project-osrm.org/route/v1/driving/
  {lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson
```

- Uses the **OSRM public demo server** (same engine as openstreetmap.org directions).
- No API key required.
- Returns GeoJSON `LineString` coordinates in `[lng, lat]` order → swapped to `[lat, lng]` for Leaflet.
- Drawn as a solid blue `Polyline` (weight 5, opacity 0.75).
- Cancelled via `AbortController` if the target changes before the request completes.
- Route is cleared (`setRouteCoords(null)`) when `directionTarget` becomes null.

`directionTarget` is set in `DiscoverClient` via `useEffect` whenever `selectedHospital` or `selectedPharmacy` changes. It is also set explicitly when the user taps the **"Directions" / "Destination"** button in the bottom sheet (`handleShowRouteInMap`).

### Markers

**Custom facility markers** (`createFacilityIcon`) — rendered as SVG-in-`divIcon` with a circle body + downward triangle pointer:

| Type             | Glyph | Fill color  | Description            |
|------------------|-------|-------------|------------------------|
| Hospital public  | `H`   | `#ef4444`   | Red                    |
| Hospital CHU     | `U`   | `#8b5cf6`   | Purple                 |
| Clinique private | `C`   | `#14b8a6`   | Teal                   |
| Pharmacy normal  | `P`   | `#06b6d4`   | Cyan                   |
| Pharmacy on-duty | `G`   | `#f59e0b`   | Amber ("de garde")     |

Selected marker: size 34px, stroke width 3. Nearest qualified: size 31px. Default: 28px.

**User location marker** (`createCurrentLocationIcon`) — pulsing blue dot with translucent halo ring. A `Circle` accuracy radius is also drawn when `locationAccuracyM` is available (clamped 25–350m).

**Radius circle** — not drawn on the map itself; radius is expressed through the visible set of markers (only markers within the radius are rendered).

---

## 5. Bottom Sheet

Slides up from `translateY(100%)` → `translateY(0)` when `sheetOpen = true` (i.e., when `selectedId !== null`).

**Swipe-to-dismiss**: tracks `touchstart` Y, accumulates drag via `touchmove`, dismisses (`setSelectedId(null)`) when drag > 80px downward on `touchend`. Spring-back: drag offset is reset on `touchend`.

**Content varies by selection type:**

### Hospital selected

- Name, address, phone (clickable `tel:` link)
- Hospital type badge (CHU / Public / Privé)
- Specialties chips (up to 5, then "+N more")
- **2 action buttons**: "Directions" (draws road route) + "Réserver" → `/patient/booking?hospitalId=…`
- **1 full-width button**: "Voir les détails" → `/patient/hospital/…`

### Pharmacy selected

- Name, neighborhood, on-duty/closed badge, distance badge
- Opening hours
- Available medicines chips (up to 5, then "+N more")
- Contextual alerts:
  - Amber alert if the committed medicine query is **not** in this pharmacy's stock
  - Rose alert if the pharmacy is **currently closed**
- **1 action button**: "Destination" (draws road route on map)

---

## 6. Filter Controls

All filter chips float over the map via `pointer-events-auto` on the chip row, `pointer-events-none` on the container (so map panning through gaps still works).

| Control            | View       | Action                                              |
|--------------------|------------|-----------------------------------------------------|
| Hôpitaux chip      | both       | Switches to `view=hospitals`, resets type/pharmacy  |
| Pharmacies chip    | both       | Switches to `view=pharmacies`, resets type/pharmacy |
| Type dropdown      | hospitals  | Filters by `public` / `private` / `chu`             |
| Duty dropdown      | pharmacies | Filters `all` or `on-duty`                          |
| Radius dropdown    | both       | `0` (auto), 2, 5, 10, 15, 20 km                    |

Clicking outside any open dropdown closes it via a `fixed inset-0 z-5` transparent overlay.

---

## 7. Data Flow Summary

```
URL params
  └─► page.tsx (server)
        ├─ getHospitalsForDiscover()   ─┐
        ├─ getPharmaciesForDiscover()   ├─► DB (SQLite / Turso)
        └─ getDiscoverMedicineNames()  ─┘
              │
              ▼
        DiscoverClient (client)
              │
              ├─► geolocation.watchPosition → userLocation (GPS)
              │
              ├─► medicineSuggestions (computed from allMedicineNames + localQuery)
              │
              ├─► filteredHospitals / visiblePharmacies (computed from props + state)
              │
              ├─► auto-select best pharmacy (useEffect on committedQuery)
              │
              ├─► directionTarget (useEffect on selectedHospital/Pharmacy)
              │
              └─► DiscoverMapLeaflet
                    │
                    ├─► OSRM fetch (road route) → routeCoords → Polyline
                    │
                    ├─► FlyToSelection → map.flyTo
                    ├─► ZoomOnRadius   → map.setView
                    └─► SyncRadiusOnZoom → onZoomRadiusChange callback
```

---

## 8. Key Design Decisions

- **No routing API key** — OSRM public demo server is used for road routing.
- **Auto-radius** — in pharmacy view with no manual radius, the app finds the tightest radius that still shows at least one pharmacy, instead of dumping all Tangier pharmacies at once.
- **`committedQuery` vs `localQuery`** — separating the live input from the confirmed query prevents the auto-select and route from firing on every keystroke; it only triggers on explicit form submit or suggestion selection.
- **`userLocationRef`** — the auto-select `useEffect` reads location via a ref to avoid re-running on every GPS update (which fires every few seconds).
- **Two-way radius ↔ zoom sync** — users can use either the dropdown or the map zoom to change the search radius; both stay in sync.
- **Server pre-fetch `allMedicineNames`** — the autocomplete catalogue is fetched once server-side (full in-stock list) so it never shrinks after a search, unlike a list derived from the current pharmacy results.
