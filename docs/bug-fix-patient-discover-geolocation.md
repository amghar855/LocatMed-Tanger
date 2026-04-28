# Bug Fix Prompt - Patient Discover Geolocation & Distance Logic

## Context

You're fixing critical bugs in the **LOCATOMED Patient Discover** feature (`/patient/discover`). The discover page allows patients to find hospitals and pharmacies in Tangier with an interactive map, but there are two major issues:

1. **User location marker not appearing** on the map
2. **Closest pharmacy sorting logic not working** correctly

**DO NOT change the design or UI** - only fix the underlying logic and data flow.

---

## Current Implementation

### Files Involved

```
app/patient/discover/page.tsx                          # Server component
features/patient/components/discover/discover-client.tsx  # Client wrapper
features/patient/components/discover/discover-map-leaflet.tsx  # Leaflet map
features/patient/services/discover/index.ts            # Data service
features/patient/constants/tangier.ts                  # Constants
```

### What's Working
✅ Map renders correctly with CARTO Light tiles
✅ Hospital/pharmacy markers display on map
✅ Filter bar (hospitals by type/specialty, pharmacies by garde)
✅ Click marker → highlight list item
✅ Click list item → center map on location
✅ Styling and layout are correct

### What's Broken
❌ User's current location marker does NOT appear on map
❌ Distance calculation runs but pharmacies are NOT sorted by distance
❌ "Closest pharmacy" logic shows incorrect results

---

## Problem 1: User Location Marker Missing

### Current Code (Broken)

**File:** `features/patient/components/discover/discover-map-leaflet.tsx`

```typescript
// User location is obtained in parent component
// But marker is NOT being rendered on the map

// Current implementation (incomplete):
<MapContainer center={[35.7595, -5.834]} zoom={13}>
  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
  
  {/* Hospital/pharmacy markers render fine */}
  {items.map(item => (
    <CircleMarker key={item.id} center={[item.lat, item.lng]}>
      {/* ... */}
    </CircleMarker>
  ))}
  
  {/* USER LOCATION MARKER IS MISSING HERE */}
</MapContainer>
```

### What Needs to Happen

1. **Pass user location** from parent `discover-client.tsx` to map component
2. **Add a distinct marker** for user's current position
3. **Use different styling** so it stands out from pharmacy/hospital markers

### Required Fix

**Step 1:** Update `discover-map-leaflet.tsx` props

```typescript
// Add userLocation to props
interface DiscoverMapProps {
  items: DiscoverItem[]
  selectedId: string | null
  onSelectItem: (id: string) => void
  userLocation: { lat: number; lng: number } | null  // ADD THIS
}

export function DiscoverMapLeaflet({
  items,
  selectedId,
  onSelectItem,
  userLocation  // ADD THIS
}: DiscoverMapProps) {
  // ... existing code
}
```

**Step 2:** Add user location marker

```typescript
<MapContainer center={[35.7595, -5.834]} zoom={13}>
  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
  
  {/* User location marker - ALWAYS render if available */}
  {userLocation && (
    <CircleMarker
      center={[userLocation.lat, userLocation.lng]}
      radius={8}
      pathOptions={{
        color: '#3b82f6',      // Blue outline
        fillColor: '#60a5fa',  // Light blue fill
        fillOpacity: 0.8,
        weight: 3
      }}
    >
      <Popup>
        <div className="text-sm font-medium">
          📍 Votre Position
        </div>
      </Popup>
    </CircleMarker>
  )}
  
  {/* Existing hospital/pharmacy markers */}
  {items.map(item => (
    <CircleMarker key={item.id} center={[item.lat, item.lng]}>
      {/* ... */}
    </CircleMarker>
  ))}
</MapContainer>
```

**Step 3:** Pass userLocation from parent

**File:** `features/patient/components/discover/discover-client.tsx`

```typescript
// This file already gets user location via geolocation API
// Just ensure it's passed to the map component

<DiscoverMapLeaflet
  items={filteredItems}
  selectedId={selectedId}
  onSelectItem={handleSelectItem}
  userLocation={userLocation}  // ADD THIS LINE
/>
```

---

## Problem 2: Closest Pharmacy Sorting Not Working

### Current Code (Broken)

**File:** `features/patient/services/discover/index.ts`

```typescript
// Distance is calculated but NOT used for sorting
export async function getPharmaciesForDiscover(filters: PharmacyDiscoverFilters) {
  // ... query pharmacies from database
  
  const results = await db.query.pharmacies.findMany({
    where: conditions,
    // NO SORTING BY DISTANCE - THIS IS THE BUG
  })
  
  return results.map(pharmacy => ({
    ...pharmacy,
    // Distance calculation happens in client component
    // But database results are not re-sorted
  }))
}
```

**File:** `features/patient/components/discover/discover-client.tsx`

```typescript
// Distance is calculated per pharmacy
const pharmaciesWithDistance = pharmacies.map(p => ({
  ...p,
  distance: calculateDistance(userLocation, { lat: p.lat, lng: p.lng })
}))

// BUT: The list is NOT sorted by distance
// It displays in database insertion order
```

### What Needs to Happen

1. **Calculate distance** for each pharmacy relative to user location
2. **Sort pharmacies** by distance (closest first)
3. **Apply radius filter** to only show pharmacies within selected range
4. **Update automatically** when user location or radius changes

### Required Fix

**Step 1:** Add distance calculation helper

**File:** `features/patient/utils/distance.ts` (CREATE THIS FILE)

```typescript
/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const R = 6371 // Earth's radius in km

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
```

**Step 2:** Update discover client to sort by distance

**File:** `features/patient/components/discover/discover-client.tsx`

```typescript
import { calculateDistance } from '@/features/patient/utils/distance'

export function DiscoverClient({ initialData, view }: DiscoverClientProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusKm, setRadiusKm] = useState(10) // Default 10km radius
  
  // Get user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Geolocation denied, using Tangier center:', error)
          // Fallback to Tangier center
          setUserLocation({
            lat: 35.7595,
            lng: -5.834
          })
        },
        { timeout: 5000 }
      )
    } else {
      // Fallback if geolocation not supported
      setUserLocation({
        lat: 35.7595,
        lng: -5.834
      })
    }
  }, [])
  
  // Calculate distance and sort pharmacies
  const pharmaciesWithDistance = useMemo(() => {
    if (!userLocation || view !== 'pharmacies') return []
    
    return initialData.pharmacies
      .map(pharmacy => ({
        ...pharmacy,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          pharmacy.lat,
          pharmacy.lng
        )
      }))
      .filter(pharmacy => {
        // Apply radius filter
        if (radiusKm === 0) return true // 0 means "all"
        return pharmacy.distance <= radiusKm
      })
      .sort((a, b) => a.distance - b.distance) // SORT BY DISTANCE (closest first)
  }, [initialData.pharmacies, userLocation, radiusKm, view])
  
  // Use the sorted list
  const displayedPharmacies = pharmaciesWithDistance
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Map */}
      <DiscoverMapLeaflet
        items={displayedPharmacies}
        selectedId={selectedId}
        onSelectItem={handleSelectItem}
        userLocation={userLocation}
      />
      
      {/* List */}
      <DiscoverList
        items={displayedPharmacies}
        selectedId={selectedId}
        onSelectItem={handleSelectItem}
      />
    </div>
  )
}
```

**Step 3:** Update pharmacy cards to show distance

**File:** `features/patient/components/discover/list.tsx`

```typescript
interface DiscoverListProps {
  items: Array<{
    id: string
    name: string
    address: string
    neighborhood: string | null
    distance?: number  // ADD THIS OPTIONAL FIELD
    // ... other fields
  }>
  selectedId: string | null
  onSelectItem: (id: string) => void
}

export function DiscoverList({ items, selectedId, onSelectItem }: DiscoverListProps) {
  return (
    <div className="space-y-3">
      {items.map(item => (
        <Card
          key={item.id}
          className={cn(
            "cursor-pointer transition-all",
            selectedId === item.id && "ring-2 ring-primary"
          )}
          onClick={() => onSelectItem(item.id)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              
              {/* SHOW DISTANCE IF AVAILABLE */}
              {item.distance !== undefined && (
                <Badge variant="secondary" className="ml-2">
                  {item.distance < 1
                    ? `${Math.round(item.distance * 1000)}m`
                    : `${item.distance.toFixed(1)}km`
                  }
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {item.address}
              {item.neighborhood && ` • ${item.neighborhood}`}
            </p>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
```

**Step 4:** Fix radius filter logic

**File:** `features/patient/components/discover/filter-bar.tsx`

```typescript
// Ensure radius filter is properly connected
export function FilterBar({ onRadiusChange }: FilterBarProps) {
  const [radius, setRadius] = useState(10)
  
  const handleRadiusChange = (value: number) => {
    setRadius(value)
    onRadiusChange(value)  // Notify parent
  }
  
  return (
    <div className="flex gap-4">
      <Select value={String(radius)} onValueChange={(v) => handleRadiusChange(Number(v))}>
        <SelectTrigger>
          <SelectValue placeholder="Rayon" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Tous</SelectItem>
          <SelectItem value="2">2 km</SelectItem>
          <SelectItem value="5">5 km</SelectItem>
          <SelectItem value="10">10 km</SelectItem>
          <SelectItem value="20">20 km</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
```

---

## Problem 3: Auto-Calculate Optimal Radius

### Current Behavior
User must manually select radius from dropdown (2km, 5km, 10km, 20km, All)

### Desired Behavior
Auto-calculate radius based on closest pharmacy distance, with sensible defaults

### Required Fix

**File:** `features/patient/components/discover/discover-client.tsx`

```typescript
// Auto-calculate optimal radius
const optimalRadius = useMemo(() => {
  if (!userLocation || view !== 'pharmacies' || initialData.pharmacies.length === 0) {
    return 10 // Default 10km
  }
  
  // Find closest pharmacy
  const distances = initialData.pharmacies.map(p =>
    calculateDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
  )
  
  const closestDistance = Math.min(...distances)
  
  // Set radius to 2x closest pharmacy distance, with min 2km and max 20km
  const calculatedRadius = Math.min(Math.max(closestDistance * 2, 2), 20)
  
  return Math.ceil(calculatedRadius) // Round up to nearest km
}, [userLocation, initialData.pharmacies, view])

// Use optimal radius if user hasn't manually selected one
const [radiusKm, setRadiusKm] = useState<number | null>(null)
const activeRadius = radiusKm ?? optimalRadius
```

---

## Testing Checklist

After implementing these fixes, verify:

### User Location Marker
- [ ] Blue circular marker appears at user's current GPS position
- [ ] Marker has distinct styling (different from pharmacy/hospital markers)
- [ ] Popup shows "📍 Votre Position" when clicked
- [ ] Marker persists when switching between hospitals/pharmacies
- [ ] Fallback to Tangier center works if geolocation denied

### Distance Calculation
- [ ] Each pharmacy card shows distance badge
- [ ] Distance is in meters if < 1km, kilometers if >= 1km
- [ ] Example: "250m" or "2.3km"
- [ ] Distance updates when user location changes

### Sorting by Distance
- [ ] Pharmacies appear in order from closest to furthest
- [ ] Closest pharmacy is always first in the list
- [ ] Order updates when radius filter changes
- [ ] Order remains stable (no flickering/jumping)

### Radius Filter
- [ ] "Tous" shows all pharmacies regardless of distance
- [ ] "2 km" shows only pharmacies within 2km
- [ ] Selecting radius updates both map and list
- [ ] Auto-calculated radius is reasonable (2-20km range)
- [ ] Manual selection overrides auto-calculated value

### Map Sync
- [ ] Click pharmacy in list → map centers on that marker
- [ ] Click marker on map → corresponding list item highlights
- [ ] User location marker does NOT interfere with pharmacy selection
- [ ] Map bounds adjust to show user + pharmacies when loading

---

## Files to Modify

### Create New File
```
features/patient/utils/distance.ts          # Haversine distance calculator
```

### Modify Existing Files
```
features/patient/components/discover/discover-map-leaflet.tsx
  - Add userLocation prop
  - Render user location marker
  - Use distinct styling (blue circle)

features/patient/components/discover/discover-client.tsx
  - Import distance calculator
  - Add geolocation API call
  - Calculate distance per pharmacy
  - Sort pharmacies by distance
  - Apply radius filter
  - Auto-calculate optimal radius
  - Pass userLocation to map

features/patient/components/discover/list.tsx
  - Add distance to item type
  - Render distance badge per pharmacy card

features/patient/components/discover/filter-bar.tsx
  - Ensure radius onChange callback is called
  - Radius values: 0 (all), 2, 5, 10, 20 km
```

---

## Implementation Notes

### Don't Change
- ❌ UI design or layout
- ❌ Color scheme or styling
- ❌ Component structure
- ❌ Database queries
- ❌ Filter logic (specialty, type, garde)

### Do Change
- ✅ Add user location marker to map
- ✅ Calculate distance per pharmacy
- ✅ Sort pharmacies by distance
- ✅ Show distance on cards
- ✅ Apply radius filter correctly
- ✅ Auto-calculate optimal radius

### Key Points
1. **User location marker must be visually distinct** - use blue color, larger radius
2. **Distance calculation must use Haversine formula** - accurate for GPS coordinates
3. **Sorting must be stable** - don't re-sort on every render (use useMemo)
4. **Fallback must work** - Tangier center if geolocation denied/unavailable
5. **Distance display must be readable** - meters for < 1km, km for >= 1km

---

## Success Criteria

✅ User can see their location on the map (blue marker)
✅ Pharmacies are sorted by distance (closest first)
✅ Distance is displayed on each pharmacy card
✅ Radius filter correctly limits results
✅ Auto-calculated radius is sensible (2-20km)
✅ Map and list remain synchronized
✅ Geolocation fallback works smoothly
✅ No console errors or warnings
✅ TypeScript compiles without errors

---

## Demo Account

Test with patient account:
```
Email: fatima@locatomed.ma
Password: demo123
```

Navigate to: `/patient/discover?view=pharmacies`

Expected result:
- Blue marker at user's location
- Pharmacies listed from closest to furthest
- Distance shown on each card (e.g., "1.2km", "450m")
- Radius filter works correctly
