# Debug & Fix - OSRM Route Still Showing Straight Line

## Current Situation

Claude Code has attempted to fix the routing issue by using a ref for userLocation to prevent effect re-runs, but **the route is still showing as a straight line**. This means there's a deeper issue with the OSRM implementation.

---

## Immediate Debugging Steps

### Step 1: Add Console Logging to OSRM Fetch

**File:** `features/patient/components/discover/discover-map-leaflet.tsx`

Add extensive logging to the OSRM fetch effect:

```typescript
useEffect(() => {
  console.log('🚀 OSRM Effect Triggered')
  console.log('directionTarget:', directionTarget)
  console.log('userLocationRef.current:', userLocationRef.current)

  if (!directionTarget || !userLocationRef.current) {
    console.log('❌ Missing target or user location, clearing route')
    setRouteCoords(null)
    return
  }

  const controller = new AbortController()

  const fetchRoute = async () => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocationRef.current.lng},${userLocationRef.current.lat};${directionTarget.lng},${directionTarget.lat}?overview=full&geometries=geojson`
      
      console.log('📍 OSRM Request URL:', url)
      console.log('📍 From:', userLocationRef.current)
      console.log('📍 To:', directionTarget)

      const response = await fetch(url, { signal: controller.signal })
      console.log('📡 OSRM Response status:', response.status)
      
      const data = await response.json()
      console.log('📦 OSRM Full Response:', data)

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const geometry = data.routes[0].geometry
        console.log('✅ OSRM Route found')
        console.log('   - Coordinates count:', geometry.coordinates.length)
        console.log('   - First 3 coords:', geometry.coordinates.slice(0, 3))
        console.log('   - Last 3 coords:', geometry.coordinates.slice(-3))
        console.log('   - Distance:', data.routes[0].distance, 'meters')
        console.log('   - Duration:', data.routes[0].duration, 'seconds')

        // Convert [lng, lat] to [lat, lng]
        const leafletCoords = geometry.coordinates.map((coord: [number, number]) => {
          return [coord[1], coord[0]] // Swap to [lat, lng]
        })
        
        console.log('🔄 Converted to Leaflet format')
        console.log('   - First point:', leafletCoords[0])
        console.log('   - Last point:', leafletCoords[leafletCoords.length - 1])
        console.log('   - Total points:', leafletCoords.length)
        
        setRouteCoords(leafletCoords)
        console.log('✅ Route coords set!')
      } else {
        console.error('❌ OSRM Error:', data.code, data.message)
        setRouteCoords(null)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ OSRM Fetch Error:', error)
      } else {
        console.log('⚠️ OSRM Request aborted')
      }
      setRouteCoords(null)
    }
  }

  fetchRoute()

  return () => {
    console.log('🧹 Cleaning up OSRM effect')
    controller.abort()
  }
}, [directionTarget])
```

### Step 2: Verify Polyline Rendering

Add logging to the Polyline component:

```typescript
// In the JSX where Polyline is rendered
{routeCoords && routeCoords.length > 0 && (
  <>
    {console.log('🎨 Rendering Polyline with', routeCoords.length, 'points')}
    {console.log('   First point:', routeCoords[0])}
    {console.log('   Last point:', routeCoords[routeCoords.length - 1])}
    <Polyline
      positions={routeCoords}
      pathOptions={{
        color: '#3b82f6',
        weight: 5,
        opacity: 0.75,
        lineJoin: 'round',
        lineCap: 'round'
      }}
    />
  </>
)}

{/* Also add logging when NO route */}
{(!routeCoords || routeCoords.length === 0) && (
  <>
    {console.log('⚠️ No route coords to render')}
    {console.log('   routeCoords:', routeCoords)}
  </>
)}
```

---

## Common Issues to Check

### Issue 1: RouteCoords State Not Updated

**Check:** Is `routeCoords` state being set correctly?

```typescript
// At the top of the component
const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null)

console.log('Current routeCoords state:', routeCoords)
```

**Expected:** Array of 50-150 coordinates after selection
**If seeing:** `null` or array with only 2 points = state not updating

### Issue 2: Polyline Not Rendering

**Check:** Is the Polyline component in the correct location in JSX?

```typescript
<MapContainer ...>
  <TileLayer ... />
  
  {/* User location marker */}
  {userLocation && <CircleMarker ... />}
  
  {/* Pharmacy markers */}
  {items.map(item => <Marker ... />)}
  
  {/* ROUTE MUST BE HERE - AFTER MARKERS */}
  {routeCoords && routeCoords.length > 0 && (
    <Polyline positions={routeCoords} ... />
  )}
</MapContainer>
```

### Issue 3: OSRM URL Malformed

**Check:** Is the URL correct?

```typescript
// CORRECT FORMAT:
https://router.project-osrm.org/route/v1/driving/-5.8340,35.7595;-5.8010,35.7690?overview=full&geometries=geojson
//                                            ↑        ↑       ↑        ↑
//                                           lng1    lat1    lng2     lat2

// WRONG (will return error):
https://router.project-osrm.org/route/v1/driving/35.7595,-5.8340;35.7690,-5.8010?...
//                                                 ↑        ↑
//                                                lat,lng (WRONG ORDER)
```

### Issue 4: Coordinate Swap Not Working

**Check:** After conversion, are coordinates in Leaflet format?

```typescript
// OSRM returns: [-5.8340, 35.7595] (lng, lat)
// After swap should be: [35.7595, -5.8340] (lat, lng)

const leafletCoords = geometry.coordinates.map(coord => [coord[1], coord[0]])
console.log('Swapped coord example:', leafletCoords[0])
// Should show: [35.xxxx, -5.xxxx] NOT [-5.xxxx, 35.xxxx]
```

### Issue 5: There's a Fallback Straight Line Being Rendered

**Check:** Is there code that draws a 2-point line as fallback?

Search for code like this:
```typescript
// BAD - This creates straight line fallback
const fallbackRoute = [
  [userLocation.lat, userLocation.lng],
  [pharmacy.lat, pharmacy.lng]
]

// If this exists, it's overriding OSRM route!
```

---

## Alternative Implementation: Use Leaflet Routing Machine

If the manual OSRM implementation continues to fail, use the library:

### Step 1: Install Package

```bash
npm install leaflet-routing-machine
npm install -D @types/leaflet-routing-machine
```

### Step 2: Replace Manual Implementation

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-routing-machine'

interface RouteControllerProps {
  userLocation: { lat: number; lng: number } | null
  destination: { lat: number; lng: number } | null
}

function RouteController({ userLocation, destination }: RouteControllerProps) {
  const map = useMap()
  const routingControlRef = useRef<L.Routing.Control | null>(null)

  useEffect(() => {
    console.log('🚀 Route Controller Effect')
    console.log('userLocation:', userLocation)
    console.log('destination:', destination)

    // Clear existing route
    if (routingControlRef.current) {
      console.log('🧹 Removing existing route')
      map.removeControl(routingControlRef.current)
      routingControlRef.current = null
    }

    // If no destination, don't draw route
    if (!destination || !userLocation) {
      console.log('⚠️ No destination or user location')
      return
    }

    console.log('🎯 Creating new route')
    
    // Create routing control
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLocation.lat, userLocation.lng),
        L.latLng(destination.lat, destination.lng)
      ],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      show: false, // Hide instructions panel
      lineOptions: {
        styles: [{ 
          color: '#3b82f6',
          weight: 5,
          opacity: 0.75
        }],
        extendToWaypoints: false,
        missingRouteTolerance: 0
      },
      createMarker: () => null // Don't create markers (we have our own)
    }).addTo(map)

    routingControlRef.current = routingControl

    // Listen for route found
    routingControl.on('routesfound', (e) => {
      console.log('✅ Route found!')
      console.log('   Distance:', e.routes[0].summary.totalDistance, 'meters')
      console.log('   Duration:', e.routes[0].summary.totalTime, 'seconds')
      console.log('   Waypoints:', e.routes[0].coordinates.length)
    })

    routingControl.on('routingerror', (e) => {
      console.error('❌ Routing error:', e)
    })

    // Cleanup
    return () => {
      console.log('🧹 Cleanup: Removing route control')
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current)
        routingControlRef.current = null
      }
    }
  }, [map, userLocation, destination])

  return null
}

// In your main map component:
export function DiscoverMapLeaflet({ ... }) {
  return (
    <MapContainer ...>
      <TileLayer ... />
      
      {/* Your existing markers */}
      
      {/* Add the route controller */}
      <RouteController
        userLocation={userLocation}
        destination={directionTarget}
      />
    </MapContainer>
  )
}
```

---

## Step 3: Check Browser Console

After adding all the logging:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console
4. Select a pharmacy in the app
5. Look for the console logs

### What to Look For:

**✅ Success Pattern:**
```
🚀 OSRM Effect Triggered
📍 OSRM Request URL: https://router.project-osrm.org/...
📡 OSRM Response status: 200
📦 OSRM Full Response: {code: "Ok", routes: [...]}
✅ OSRM Route found
   - Coordinates count: 127
   - Distance: 2450 meters
🔄 Converted to Leaflet format
   - Total points: 127
✅ Route coords set!
🎨 Rendering Polyline with 127 points
```

**❌ Failure Patterns:**

**Pattern 1: Effect Not Running**
```
(No logs at all)
```
→ directionTarget is not being set when pharmacy is selected

**Pattern 2: OSRM Error**
```
🚀 OSRM Effect Triggered
📍 OSRM Request URL: https://...
❌ OSRM Error: InvalidUrl
```
→ URL is malformed

**Pattern 3: No Coordinates**
```
✅ OSRM Route found
   - Coordinates count: 0
```
→ OSRM returned empty geometry

**Pattern 4: Not Rendering**
```
✅ Route coords set!
⚠️ No route coords to render
   routeCoords: null
```
→ State update failed or component re-rendered

---

## Emergency Fix: Force Visible Route

If all else fails, add this temporary fix to visually confirm the route data:

```typescript
// Add this RIGHT AFTER setRouteCoords(leafletCoords)
// This will log every single coordinate point
console.log('🗺️ FULL ROUTE DATA:')
leafletCoords.forEach((coord, i) => {
  console.log(`   Point ${i}: [${coord[0]}, ${coord[1]}]`)
})

// Also try rendering circles at each route point to see if they appear
{routeCoords && routeCoords.map((coord, i) => (
  <CircleMarker
    key={`route-point-${i}`}
    center={coord}
    radius={2}
    pathOptions={{
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 1
    }}
  />
))}
```

If you see 50-150 red dots following streets, the data is correct but Polyline rendering is broken.

---

## Checklist

Run through this checklist:

- [ ] Added console logging to OSRM fetch effect
- [ ] Added console logging to Polyline rendering
- [ ] Checked browser console output
- [ ] Verified OSRM URL format (lng,lat order)
- [ ] Verified coordinate swap ([lat,lng] after conversion)
- [ ] Verified routeCoords state updates
- [ ] Checked for conflicting straight-line code
- [ ] Tried Leaflet Routing Machine library as alternative
- [ ] Verified Polyline is inside MapContainer
- [ ] Checked no z-index issues hiding the line

---

## Report Back

After adding the logging, provide:

1. **Console output** when selecting a pharmacy
2. **Screenshot** of browser DevTools Console tab
3. **Value of routeCoords** from React DevTools
4. **Any errors** in console

This will help identify the exact issue!
