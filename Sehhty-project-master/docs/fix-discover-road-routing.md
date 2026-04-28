# Fix - Patient Discover: Road-Based Routing (Not Straight Line)

## Context

The Patient Discover feature (`/patient/discover`) currently shows a **straight line** between the user location and selected pharmacy, as visible in the screenshot. This is incorrect for navigation purposes - users need to see the **actual road route** they should follow, similar to Google Maps.

**Current Issue:**
```
User Location 🔵 ──────────────► Pharmacy 🟡
        (Straight blue line - WRONG)
```

**Required Behavior:**
```
User Location 🔵 ─┐
                  │ Following
                  └─► streets
                      and roads
                      (Google Maps style)
                         │
                         └─► Pharmacy 🟡
```

---

## Current Implementation (Working but Incomplete)

Based on `pharma_process.md`, the routing infrastructure is **already in place**:

### ✅ What's Already Working:

1. **OSRM Integration** - Free road routing API (no key needed)
2. **Route fetching** - Happens when `directionTarget` is set
3. **Polyline rendering** - Blue line drawn on map
4. **Auto-trigger** - Route draws when pharmacy selected

### ❌ What's Broken:

The route **IS being fetched from OSRM** and **IS being drawn**, but it's appearing as a **straight line** instead of following the roads. This suggests one of these issues:

1. OSRM response is correct but polyline rendering is wrong
2. Coordinates are being swapped (lat/lng vs lng/lat)
3. Polyline is drawn but hidden/styled incorrectly
4. Route geometry is not being decoded properly

---

## The Fix: Verify OSRM Implementation

### File: `features/patient/components/discover/discover-map-leaflet.tsx`

The OSRM routing code should look like this:

```typescript
// OSRM Route Fetching Effect
useEffect(() => {
  if (!directionTarget || !userLocation) {
    setRouteCoords(null)
    return
  }

  const controller = new AbortController()

  const fetchRoute = async () => {
    try {
      // CRITICAL: OSRM expects coordinates in [lng, lat] order
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${directionTarget.lng},${directionTarget.lat}?overview=full&geometries=geojson`

      const response = await fetch(url, { signal: controller.signal })
      const data = await response.json()

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // OSRM returns GeoJSON with coordinates in [lng, lat] format
        const geometry = data.routes[0].geometry
        
        // CRITICAL: Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
        const leafletCoords = geometry.coordinates.map((coord: [number, number]) => [
          coord[1], // latitude (swap to first position)
          coord[0]  // longitude (swap to second position)
        ])
        
        setRouteCoords(leafletCoords)
      } else {
        console.error('OSRM routing failed:', data)
        setRouteCoords(null)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Route fetch error:', error)
      }
      setRouteCoords(null)
    }
  }

  fetchRoute()

  return () => controller.abort()
}, [directionTarget, userLocation])
```

### Key Points to Verify:

#### 1. URL Construction (OSRM expects `lng,lat`)
```typescript
// CORRECT:
`${userLocation.lng},${userLocation.lat};${pharmacy.lng},${pharmacy.lat}`

// WRONG:
`${userLocation.lat},${userLocation.lng};${pharmacy.lat},${pharmacy.lng}`
```

#### 2. Coordinate Conversion (GeoJSON → Leaflet)
```typescript
// GeoJSON uses [lng, lat] order
// Leaflet uses [lat, lng] order
// YOU MUST SWAP THEM

// CORRECT:
geometry.coordinates.map(coord => [coord[1], coord[0]])
//                                  ↑       ↑
//                                  lat     lng

// WRONG (will draw straight line or broken path):
geometry.coordinates.map(coord => [coord[0], coord[1]])
```

#### 3. Polyline Rendering
```typescript
{routeCoords && routeCoords.length > 0 && (
  <Polyline
    positions={routeCoords}
    pathOptions={{
      color: '#3b82f6',      // Blue color
      weight: 5,             // Line thickness
      opacity: 0.75,         // Semi-transparent
      lineJoin: 'round',     // Smooth corners
      lineCap: 'round'       // Rounded ends
    }}
  />
)}
```

---

## Debugging Checklist

If the route is still showing as a straight line, check these:

### 1. Verify OSRM Response
```typescript
// Add console.log to inspect the response
const response = await fetch(url)
const data = await response.json()
console.log('OSRM Response:', data)
console.log('Route geometry:', data.routes[0].geometry)
console.log('Coordinates count:', data.routes[0].geometry.coordinates.length)

// You should see:
// - code: "Ok"
// - routes[0].geometry.coordinates: Array with 20-100+ points
// - Each point: [lng, lat] format
```

### 2. Verify Coordinate Swap
```typescript
// Add console.log after conversion
const leafletCoords = geometry.coordinates.map(coord => [coord[1], coord[0]])
console.log('First point (should be user location):', leafletCoords[0])
console.log('Last point (should be pharmacy):', leafletCoords[leafletCoords.length - 1])
console.log('Total route points:', leafletCoords.length)

// Expected output:
// First point: [35.7595, -5.834] (user location in Tangier)
// Last point: [35.7xxx, -5.8xxx] (pharmacy location)
// Total route points: 50-150 (depends on distance)
```

### 3. Verify Polyline Renders
```typescript
// In the JSX, add debug logging
{routeCoords && routeCoords.length > 0 && (
  <>
    {console.log('Drawing polyline with', routeCoords.length, 'points')}
    <Polyline
      positions={routeCoords}
      pathOptions={{
        color: '#3b82f6',
        weight: 5,
        opacity: 0.75
      }}
    />
  </>
)}
```

### 4. Check for Z-Index Issues
```typescript
// Ensure polyline is above map tiles but below markers
<Polyline
  positions={routeCoords}
  pathOptions={{
    color: '#3b82f6',
    weight: 5,
    opacity: 0.75
  }}
  // Add pane to control rendering order
  pane="overlayPane"  // This is the default, but make it explicit
/>
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Not Swapping Coordinates
```typescript
// WRONG - Will draw a line but in wrong location
const leafletCoords = geometry.coordinates  // Direct use

// CORRECT - Swap [lng, lat] to [lat, lng]
const leafletCoords = geometry.coordinates.map(c => [c[1], c[0]])
```

### ❌ Mistake 2: Using Wrong OSRM Endpoint
```typescript
// WRONG - Returns simplified geometry
`?overview=simplified&geometries=geojson`

// CORRECT - Returns full detailed geometry
`?overview=full&geometries=geojson`
```

### ❌ Mistake 3: Drawing Line Between Two Points Only
```typescript
// WRONG - This creates a straight line
const routeCoords = [
  [userLocation.lat, userLocation.lng],
  [pharmacy.lat, pharmacy.lng]
]

// CORRECT - Use all points from OSRM response
const routeCoords = geometry.coordinates.map(c => [c[1], c[0]])
```

---

## Expected Result

After fixing:

### Before (Straight Line) ❌
```
🔵 ─────────────────► 🟡
   Single straight segment
```

### After (Following Roads) ✅
```
🔵 ─┐
    │ Multiple segments
    └─┐ following actual streets
      │
      └─► 🟡
   
   50-150 coordinate points
   Follows real road network
```

### Visual Indicators of Success:

1. ✅ Route has **many points** (50-150), not just 2
2. ✅ Route **follows streets** visible on map
3. ✅ Route **curves** around buildings and obstacles
4. ✅ Route **respects one-way streets** (OSRM handles this)
5. ✅ Route **distance** matches expected driving distance

---

## Testing

### Test Case 1: Short Distance (< 1km)
```typescript
// User at Tangier center: [35.7673, -5.7998]
// Pharmacy nearby: [35.7690, -5.8010]
// Expected: 10-30 route points, ~0.5km route
```

### Test Case 2: Medium Distance (2-5km)
```typescript
// User at Tangier center: [35.7673, -5.7998]
// Pharmacy in suburb: [35.7800, -5.8200]
// Expected: 50-100 route points, ~3km route
```

### Test Case 3: Across City (> 5km)
```typescript
// User at Tangier center: [35.7673, -5.7998]
// Pharmacy far: [35.7500, -5.8500]
// Expected: 100-200 route points, ~8km route
```

---

## Alternative: Leaflet Routing Machine

If OSRM manual implementation is problematic, use the `leaflet-routing-machine` library:

```typescript
import L from 'leaflet'
import 'leaflet-routing-machine'

// Inside map component
useEffect(() => {
  if (!map || !directionTarget || !userLocation) return

  const routingControl = L.Routing.control({
    waypoints: [
      L.latLng(userLocation.lat, userLocation.lng),
      L.latLng(directionTarget.lat, directionTarget.lng)
    ],
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
    routeWhileDragging: false,
    show: false, // Hide turn-by-turn instructions
    addWaypoints: false, // Prevent adding waypoints
    lineOptions: {
      styles: [{ 
        color: '#3b82f6', 
        weight: 5,
        opacity: 0.75
      }]
    }
  }).addTo(map)

  return () => {
    map.removeControl(routingControl)
  }
}, [map, directionTarget, userLocation])
```

**Pros:**
- Handles coordinate conversion automatically
- Well-tested and reliable
- Easy to implement

**Cons:**
- Larger bundle size
- Less control over styling

---

## Summary

The issue is **NOT** that OSRM isn't being used. Based on the screenshot and `pharma_process.md`, OSRM **is** integrated. The problem is likely:

1. **Coordinate swap error** - [lng, lat] not converted to [lat, lng]
2. **Wrong OSRM parameter** - Using `simplified` instead of `full`
3. **Polyline rendering issue** - Not using the full geometry

**Fix priority:**
1. Verify coordinate conversion (most likely issue)
2. Verify OSRM URL parameters
3. Add debug logging to inspect response
4. Check polyline rendering

**Expected behavior:**
- Route follows real streets (like Google Maps)
- 50-150 coordinate points per route
- Curved path, not straight line
- Matches actual driving distance

---

## Usage Prompt for Claude Code

```
Read this file and fix the routing in Patient Discover feature. The route between user and pharmacy is currently showing as a STRAIGHT LINE but it should follow the actual STREETS AND ROADS like Google Maps. The OSRM integration is already in place - the issue is likely in the coordinate conversion (GeoJSON [lng,lat] must be swapped to Leaflet [lat,lng]) or the polyline is only using start/end points instead of the full geometry from OSRM. Verify the OSRM response is using 'overview=full&geometries=geojson' and that all coordinates are properly converted. The route should have 50-150 points following real streets, not just 2 points in a straight line.
```
