# Bug Fix - Patient Discover: Align with Pharmacy Finder Logic

## Context

You're fixing the **Patient Discover** feature (`/patient/discover`) to match the exact logic and behavior of the **Pharmacy Finder** system. The discover page should allow patients to find pharmacies in Tangier with proper user location display, distance-based sorting, and visual marker differentiation.

**Critical:** This fix focuses on matching the pharmacy finder specification exactly - DO NOT change the existing UI design, only fix the underlying logic.

---

## Current vs Required State

### What's Already Working ✅
- Basic Leaflet map with CARTO Light tiles
- Pharmacy/hospital data loading from database
- Filter bar (type, specialty, garde status)
- Click interactions (marker ↔ list sync)

### What's Broken / Missing ❌
1. **User location marker** - Not visible on map
2. **Distance calculation** - Computed but not used for sorting
3. **Marker differentiation** - All pharmacies use same marker style
4. **Garde pharmacies** - Not visually distinct (should be amber/gold)
5. **Closest pharmacy logic** - Results not sorted by distance
6. **Routing capability** - No route visualization to selected pharmacy

---

## Pharmacy Finder Specification to Match

Based on the original pharmacy finder prompt, the following behaviors MUST be implemented:

### 1. Map Interface Requirements

#### A. Marker Differentiation (Critical)
```typescript
// Pharmacy markers MUST use different colors based on garde status:
// - Regular pharmacies: Cyan/Blue markers
// - Garde pharmacies (isOnDuty=true): Amber/Gold markers
// - User location: Distinct blue circle marker

const getMarkerColor = (pharmacy: Pharmacy) => {
  if (pharmacy.isOnDuty) {
    return '#f59e0b' // Amber for garde pharmacies
  }
  return '#06b6d4'   // Cyan for regular pharmacies
}
```

#### B. Rich Popups with Pharmacy Details
```typescript
// Each marker popup must show:
// - Pharmacy name
// - Full address
// - Phone number
// - Opening hours (open_time - close_time)
// - "DE GARDE" badge if isOnDuty === true
// - Distance from user location
// - Link to pharmacy details or medicine search
```

#### C. User Location Marker
```typescript
// User's current GPS position must be displayed with:
// - Distinct styling (blue, larger than pharmacy markers)
// - Clear "Votre Position" label in popup
// - Always visible when geolocation is available
// - Fallback to Tangier center (35.7595, -5.834) if denied
```

### 2. Distance-Based Sorting Logic

#### A. Haversine Distance Calculation
```typescript
/**
 * Calculate great-circle distance between two GPS points
 * This is the REQUIRED formula for accurate distance
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180
  const R = 6371 // Earth's radius in kilometers

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
```

#### B. Sorting Priority (EXACT ORDER)
```typescript
// Pharmacies MUST be sorted in this exact priority:
// 1. Stock status (if searching for medicine)
//    - in_stock > low_stock > out_of_stock
// 2. Garde status (isOnDuty pharmacies first)
// 3. Distance (closest first)

pharmacies.sort((a, b) => {
  // Priority 1: Stock status (if applicable)
  if (searchingForMedicine) {
    const stockDiff = rankStock(b.stockStatus) - rankStock(a.stockStatus)
    if (stockDiff !== 0) return stockDiff
  }
  
  // Priority 2: Garde status
  if (a.isOnDuty !== b.isOnDuty) {
    return b.isOnDuty ? 1 : -1  // Garde pharmacies first
  }
  
  // Priority 3: Distance
  return a.distance - b.distance
})
```

### 3. Radius Filter with Auto-Calculation

#### A. Auto-Calculate Optimal Radius
```typescript
// System must automatically calculate radius based on closest pharmacy
// This ensures user always sees relevant results

const calculateOptimalRadius = (
  pharmacies: Pharmacy[],
  userLocation: Location
): number => {
  if (pharmacies.length === 0) return 10 // Default 10km
  
  const distances = pharmacies.map(p =>
    calculateDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
  )
  
  const closestDistance = Math.min(...distances)
  
  // Radius = 2x closest pharmacy distance
  // Bounded between 2km (min) and 20km (max)
  return Math.min(Math.max(closestDistance * 2, 2), 20)
}
```

#### B. Radius Filter Options
```typescript
// Required radius options in dropdown:
const RADIUS_OPTIONS = [
  { value: 0, label: 'Tous' },        // Show all pharmacies
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
]
```

### 4. Route Visualization (Advanced)

#### A. Routing Machine Integration
```typescript
// When user selects a pharmacy, show route from their location
import L from 'leaflet'
import 'leaflet-routing-machine'

const addRoute = (map: L.Map, userLoc: Location, pharmacyLoc: Location) => {
  const routingControl = L.Routing.control({
    waypoints: [
      L.latLng(userLoc.lat, userLoc.lng),
      L.latLng(pharmacyLoc.lat, pharmacyLoc.lng)
    ],
    routeWhileDragging: false,
    show: false, // Hide turn-by-turn instructions panel
    addWaypoints: false, // Prevent adding intermediate waypoints
    lineOptions: {
      styles: [{ 
        color: '#06b6d4', // Cyan to match theme
        weight: 4,
        opacity: 0.7
      }]
    }
  }).addTo(map)
  
  return routingControl
}
```

#### B. Map Animation
```typescript
// When pharmacy is selected, animate map to that location
map.flyTo(
  [pharmacy.lat, pharmacy.lng],
  15, // Zoom level for detail view
  {
    duration: 1.5, // Animation duration in seconds
    easeLinearity: 0.25
  }
)
```

---

## Implementation Steps

### Step 1: Create Distance Utility

**File:** `features/patient/utils/distance.ts` (NEW FILE)

```typescript
/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180
  const R = 6371 // Earth's radius in km

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Format distance for display
 * @returns Formatted string (e.g., "1.2 km" or "350 m")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
}
```

---

### Step 2: Update Map Component with Differentiated Markers

**File:** `features/patient/components/discover/discover-map-leaflet.tsx`

```typescript
'use client'

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface DiscoverMapProps {
  items: Array<{
    id: string
    name: string
    address: string
    lat: number
    lng: number
    isOnDuty?: boolean
    phone?: string
    openTime?: string
    closeTime?: string
    distance?: number
  }>
  selectedId: string | null
  onSelectItem: (id: string) => void
  userLocation: { lat: number; lng: number } | null
  view: 'hospitals' | 'pharmacies'
}

// Map center controller component
function MapViewController({ 
  selectedId, 
  items 
}: { 
  selectedId: string | null
  items: DiscoverMapProps['items'] 
}) {
  const map = useMap()
  
  useEffect(() => {
    if (selectedId) {
      const selected = items.find(item => item.id === selectedId)
      if (selected) {
        map.flyTo([selected.lat, selected.lng], 15, {
          duration: 1.5,
          easeLinearity: 0.25
        })
      }
    }
  }, [selectedId, items, map])
  
  return null
}

export function DiscoverMapLeaflet({
  items,
  selectedId,
  onSelectItem,
  userLocation,
  view
}: DiscoverMapProps) {
  const isPharmacyView = view === 'pharmacies'
  
  return (
    <MapContainer
      center={[35.7595, -5.834]} // Tangier center
      zoom={13}
      className="h-full w-full rounded-lg"
      zoomControl={true}
    >
      {/* CARTO Light tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* User Location Marker - ALWAYS show if available */}
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{
            color: '#3b82f6',      // Blue outline
            fillColor: '#60a5fa',  // Light blue fill
            fillOpacity: 0.9,
            weight: 3
          }}
        >
          <Popup>
            <div className="text-sm font-semibold">
              📍 Votre Position
            </div>
          </Popup>
        </CircleMarker>
      )}
      
      {/* Pharmacy/Hospital Markers */}
      {items.map(item => {
        const isSelected = item.id === selectedId
        const isGarde = isPharmacyView && item.isOnDuty
        
        // Marker color based on type and garde status
        const markerColor = isGarde 
          ? '#f59e0b'  // Amber for garde pharmacies
          : isPharmacyView 
            ? '#06b6d4'  // Cyan for regular pharmacies
            : '#8b5cf6'  // Purple for hospitals
        
        const fillColor = isGarde
          ? '#fbbf24'  // Light amber
          : isPharmacyView
            ? '#22d3ee'  // Light cyan
            : '#a78bfa'  // Light purple
        
        return (
          <CircleMarker
            key={item.id}
            center={[item.lat, item.lng]}
            radius={isSelected ? 10 : 7}
            pathOptions={{
              color: markerColor,
              fillColor: fillColor,
              fillOpacity: isSelected ? 1 : 0.7,
              weight: isSelected ? 3 : 2
            }}
            eventHandlers={{
              click: () => onSelectItem(item.id)
            }}
          >
            <Popup>
              <div className="min-w-[200px] space-y-2">
                {/* Pharmacy/Hospital Name */}
                <div className="font-semibold text-base">
                  {item.name}
                </div>
                
                {/* DE GARDE Badge */}
                {isGarde && (
                  <div className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded">
                    🌙 DE GARDE
                  </div>
                )}
                
                {/* Address */}
                <div className="text-sm text-gray-600">
                  📍 {item.address}
                </div>
                
                {/* Phone */}
                {item.phone && (
                  <div className="text-sm text-gray-600">
                    📞 {item.phone}
                  </div>
                )}
                
                {/* Opening Hours */}
                {item.openTime && item.closeTime && (
                  <div className="text-sm text-gray-600">
                    🕐 {item.openTime} - {item.closeTime}
                  </div>
                )}
                
                {/* Distance */}
                {item.distance !== undefined && (
                  <div className="text-sm font-medium text-primary">
                    📏 {item.distance < 1 
                      ? `${Math.round(item.distance * 1000)} m`
                      : `${item.distance.toFixed(1)} km`
                    }
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
      
      {/* Map view controller */}
      <MapViewController selectedId={selectedId} items={items} />
    </MapContainer>
  )
}
```

---

### Step 3: Update Client Component with Distance Sorting

**File:** `features/patient/components/discover/discover-client.tsx`

```typescript
'use client'

import { useState, useEffect, useMemo } from 'react'
import { calculateDistance } from '@/features/patient/utils/distance'
import { DiscoverMapLeaflet } from './discover-map-leaflet'
import { DiscoverList } from './list'
import { FilterBar } from './filter-bar'

interface DiscoverClientProps {
  initialData: {
    hospitals: Hospital[]
    pharmacies: Pharmacy[]
  }
  view: 'hospitals' | 'pharmacies'
}

export function DiscoverClient({ initialData, view }: DiscoverClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusKm, setRadiusKm] = useState<number | null>(null) // null = auto
  const [medicineQuery, setMedicineQuery] = useState('')
  
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
        { 
          timeout: 5000,
          enableHighAccuracy: true
        }
      )
    } else {
      // No geolocation support
      setUserLocation({
        lat: 35.7595,
        lng: -5.834
      })
    }
  }, [])
  
  // Calculate distances and sort pharmacies
  const pharmaciesWithDistance = useMemo(() => {
    if (!userLocation || view !== 'pharmacies') return []
    
    const withDistance = initialData.pharmacies.map(pharmacy => ({
      ...pharmacy,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        pharmacy.lat,
        pharmacy.lng
      )
    }))
    
    // Auto-calculate optimal radius if not manually set
    if (radiusKm === null && withDistance.length > 0) {
      const closestDistance = Math.min(...withDistance.map(p => p.distance))
      const autoRadius = Math.min(Math.max(closestDistance * 2, 2), 20)
      setRadiusKm(Math.ceil(autoRadius))
    }
    
    // Apply radius filter
    const filtered = radiusKm === 0 
      ? withDistance 
      : withDistance.filter(p => p.distance <= (radiusKm ?? 10))
    
    // Sort by: garde status first, then distance
    return filtered.sort((a, b) => {
      // Priority 1: Garde pharmacies first
      if (a.isOnDuty !== b.isOnDuty) {
        return b.isOnDuty ? 1 : -1
      }
      
      // Priority 2: Closest distance
      return a.distance - b.distance
    })
  }, [initialData.pharmacies, userLocation, radiusKm, view])
  
  // For hospitals, just add distance without special sorting
  const hospitalsWithDistance = useMemo(() => {
    if (!userLocation || view !== 'hospitals') return []
    
    return initialData.hospitals
      .map(hospital => ({
        ...hospital,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          hospital.lat,
          hospital.lng
        )
      }))
      .sort((a, b) => a.distance - b.distance)
  }, [initialData.hospitals, userLocation, view])
  
  const displayItems = view === 'pharmacies' 
    ? pharmaciesWithDistance 
    : hospitalsWithDistance
  
  const handleSelectItem = (id: string) => {
    setSelectedId(id === selectedId ? null : id)
  }
  
  return (
    <div className="h-[calc(100vh-12rem)] grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Filter Bar */}
      <div className="lg:col-span-2">
        <FilterBar
          view={view}
          radiusKm={radiusKm ?? 10}
          onRadiusChange={setRadiusKm}
          medicineQuery={medicineQuery}
          onMedicineQueryChange={setMedicineQuery}
        />
      </div>
      
      {/* Map */}
      <div className="h-full rounded-lg overflow-hidden border">
        <DiscoverMapLeaflet
          items={displayItems}
          selectedId={selectedId}
          onSelectItem={handleSelectItem}
          userLocation={userLocation}
          view={view}
        />
      </div>
      
      {/* List */}
      <div className="h-full overflow-y-auto">
        <DiscoverList
          items={displayItems}
          selectedId={selectedId}
          onSelectItem={handleSelectItem}
          view={view}
        />
      </div>
    </div>
  )
}
```

---

### Step 4: Update List Component with Distance Badges

**File:** `features/patient/components/discover/list.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistance } from '@/features/patient/utils/distance'

interface DiscoverListProps {
  items: Array<{
    id: string
    name: string
    address: string
    neighborhood?: string | null
    distance?: number
    isOnDuty?: boolean
    phone?: string
    openTime?: string
    closeTime?: string
  }>
  selectedId: string | null
  onSelectItem: (id: string) => void
  view: 'hospitals' | 'pharmacies'
}

export function DiscoverList({ items, selectedId, onSelectItem, view }: DiscoverListProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          {view === 'pharmacies' 
            ? 'Aucune pharmacie trouvée dans ce rayon'
            : 'Aucun hôpital trouvé'
          }
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3 p-4">
      {items.map((item, index) => (
        <Card
          key={item.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedId === item.id && "ring-2 ring-primary shadow-lg"
          )}
          onClick={() => onSelectItem(item.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">
                {index === 0 && view === 'pharmacies' && (
                  <span className="text-xs text-muted-foreground mr-2">
                    ⭐ La plus proche
                  </span>
                )}
                {item.name}
              </CardTitle>
              
              <div className="flex flex-col gap-1 items-end">
                {/* Distance Badge */}
                {item.distance !== undefined && (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    📏 {formatDistance(item.distance)}
                  </Badge>
                )}
                
                {/* DE GARDE Badge */}
                {item.isOnDuty && (
                  <Badge 
                    variant="default" 
                    className="bg-amber-500 hover:bg-amber-600 whitespace-nowrap"
                  >
                    🌙 DE GARDE
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              📍 {item.address}
              {item.neighborhood && ` • ${item.neighborhood}`}
            </p>
            
            {item.phone && (
              <p className="text-muted-foreground">
                📞 {item.phone}
              </p>
            )}
            
            {item.openTime && item.closeTime && (
              <p className="text-muted-foreground">
                🕐 {item.openTime} - {item.closeTime}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

---

### Step 5: Update Filter Bar

**File:** `features/patient/components/discover/filter-bar.tsx`

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FilterBarProps {
  view: 'hospitals' | 'pharmacies'
  radiusKm: number
  onRadiusChange: (km: number) => void
  medicineQuery: string
  onMedicineQueryChange: (query: string) => void
}

export function FilterBar({
  view,
  radiusKm,
  onRadiusChange,
  medicineQuery,
  onMedicineQueryChange
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Radius Filter - Only for pharmacies */}
      {view === 'pharmacies' && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Rayon:</label>
          <Select 
            value={String(radiusKm)} 
            onValueChange={(v) => onRadiusChange(Number(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
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
      )}
      
      {/* Medicine Search - Only for pharmacies */}
      {view === 'pharmacies' && (
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Rechercher un médicament..."
            value={medicineQuery}
            onChange={(e) => onMedicineQueryChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
```

---

## Testing Checklist

### User Location ✅
- [ ] Blue circular marker appears at user's GPS position
- [ ] Marker is visually distinct (larger, different color)
- [ ] Popup shows "📍 Votre Position"
- [ ] Fallback to Tangier center works if geolocation denied
- [ ] Marker persists when switching views

### Marker Differentiation ✅
- [ ] Regular pharmacies: Cyan markers (#06b6d4)
- [ ] Garde pharmacies: Amber markers (#f59e0b)
- [ ] Hospitals: Purple markers (#8b5cf6)
- [ ] Selected item: Larger radius + higher opacity
- [ ] "DE GARDE" badge in popup for garde pharmacies

### Distance Sorting ✅
- [ ] Closest pharmacy is first in list
- [ ] "⭐ La plus proche" label on first item
- [ ] Distance badge on each card
- [ ] Format: "350 m" or "2.3 km"
- [ ] List updates when radius changes

### Garde Priority ✅
- [ ] Garde pharmacies appear before regular (same distance)
- [ ] Amber markers visible on map
- [ ] "🌙 DE GARDE" badge on cards and popups

### Radius Filter ✅
- [ ] "Tous" shows all pharmacies
- [ ] "2 km" shows only within 2km
- [ ] Auto-calculated radius is sensible (2-20km)
- [ ] Manual selection overrides auto value

### Map Animation ✅
- [ ] Click pharmacy in list → map flies to location
- [ ] Click marker → list scrolls to item
- [ ] Smooth animation (1.5s duration)
- [ ] Zoom level increases on selection

---

## Success Criteria

✅ **Matches pharmacy finder specification exactly:**
1. User location marker visible and distinct
2. Pharmacies sorted by: garde status → distance
3. Marker colors differentiate garde vs regular
4. Rich popups with all pharmacy details
5. Distance calculated with Haversine formula
6. Auto-radius calculation based on closest pharmacy
7. Map animations smooth and responsive

✅ **No design changes:**
- All existing UI preserved
- Only logic and data flow updated
- Styling remains consistent

✅ **Production ready:**
- No TypeScript errors
- No console warnings
- Geolocation fallback works
- Mobile responsive

---

## Demo Account

Test with:
```
Email: fatima@locatomed.ma
Password: demo123
```

Navigate to: `/patient/discover?view=pharmacies`

Expected:
- Blue marker at your GPS location
- Pharmacies sorted closest → furthest
- Garde pharmacies with amber markers
- Distance on each card
- "⭐ La plus proche" on first item

---

## Files Summary

**CREATE:**
- `features/patient/utils/distance.ts`

**MODIFY:**
- `features/patient/components/discover/discover-map-leaflet.tsx`
- `features/patient/components/discover/discover-client.tsx`
- `features/patient/components/discover/list.tsx`
- `features/patient/components/discover/filter-bar.tsx`

**NO CHANGES:**
- Database schema
- Server actions
- Page routes
- Other patient features
