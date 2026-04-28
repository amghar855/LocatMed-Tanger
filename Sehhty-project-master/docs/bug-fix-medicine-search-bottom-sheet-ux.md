# Bug Fix - Medicine Search: Bottom Sheet & Map Centering UX

## Context

You're fixing critical UX issues in the **Medicine Search** feature (`/patient/medicine-search`) after a user searches for a medicine (e.g., "DOLIPRANE"). The current implementation has two major problems that harm the user experience:

1. **Bottom sheet is too large** - Covers ~50% of screen, hiding the map
2. **Destination marker not centered** - User must manually scroll map to see selected pharmacy

**Critical:** Fix ONLY the UX issues. Do NOT change the design language, colors, or overall layout structure.

---

## Current Issues (From Screenshot Analysis)

### Issue 1: Bottom Sheet Height ❌

**Current Behavior:**
- Bottom sheet takes up approximately 50% of screen height
- Map is mostly hidden behind the sheet
- User cannot see pharmacy location without dismissing the sheet
- "Destination" button and pharmacy details push map out of view

**Problem:**
- Search results should show map prominently
- Bottom sheet should be compact by default
- User should see both map marker AND pharmacy details simultaneously

### Issue 2: Map Not Centered on Destination ❌

**Current Behavior:**
- When pharmacy is selected, map stays at default position
- Selected pharmacy marker may be off-screen or obscured
- User must manually pan/scroll to find the destination
- No visual feedback that destination is the focus

**Problem:**
- Map should auto-center on selected pharmacy
- Appropriate zoom level to show context
- Smooth animation to guide user's attention

---

## Required Fixes

### Fix 1: Compact Bottom Sheet with Swipe Gesture

#### A. Default State - Compact Preview (Required)

**Height Calculation:**
```typescript
// Bottom sheet should take MAXIMUM 35% of screen height in compact mode
// This ensures map is always visible

const COMPACT_HEIGHT = '35vh'  // 35% of viewport height
const EXPANDED_HEIGHT = '85vh' // When user swipes up
```

**Visual Layout (Compact State):**
```
┌─────────────────────────┐
│                         │
│      MAP (65%)          │  ← Most of screen shows map
│      Visible            │
│                         │
├─────────────────────────┤
│ ┌─ Pharmacie Al Hamd   │
│ │  Souani              │  ← Compact preview
│ │  • Open - On duty    │     showing key info
│ │  📍 3.2 km           │
│ └─ [Destination] ──────┤  ← 35% of screen
└─────────────────────────┘
```

#### B. Swipe-to-Expand Behavior

**Implementation:**
```typescript
'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useState } from 'react'

interface PharmacyBottomSheetProps {
  pharmacy: {
    id: string
    name: string
    address: string
    distance: number
    isOnDuty: boolean
    openTime: string
    closeTime: string
    availableMedicine: string
  }
  onClose: () => void
  onNavigate: () => void
}

export function PharmacyBottomSheet({
  pharmacy,
  onClose,
  onNavigate
}: PharmacyBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 
        bg-white rounded-t-3xl shadow-2xl
        transition-all duration-300 ease-out
        ${isExpanded ? 'h-[85vh]' : 'h-[35vh]'}
      `}
    >
      {/* Swipe Handle */}
      <div 
        className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
        onTouchStart={(e) => {
          const startY = e.touches[0].clientY
          const handleTouchMove = (e: TouchEvent) => {
            const currentY = e.touches[0].clientY
            const diff = startY - currentY
            
            // Swipe up = expand, swipe down = collapse
            if (diff > 50) setIsExpanded(true)
            if (diff < -50) setIsExpanded(false)
          }
          
          document.addEventListener('touchmove', handleTouchMove)
          document.addEventListener('touchend', () => {
            document.removeEventListener('touchmove', handleTouchMove)
          }, { once: true })
        }}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>
      
      {/* Content */}
      <div className="px-4 pb-safe">
        {/* Compact Preview - Always Visible */}
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-teal-600 text-xl">💊</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{pharmacy.name}</h3>
                <p className="text-sm text-gray-500">{pharmacy.address.split(',')[0]}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Key Info - One Line */}
          <div className="flex items-center gap-4 text-sm">
            {pharmacy.isOnDuty && (
              <span className="flex items-center gap-1 text-teal-600 font-medium">
                • Open - On duty
              </span>
            )}
            <span className="flex items-center gap-1 text-gray-600">
              📍 {pharmacy.distance.toFixed(1)} km
            </span>
          </div>
          
          {/* Available Medicine Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm">
            <span className="w-2 h-2 bg-teal-500 rounded-full" />
            {pharmacy.availableMedicine}
          </div>
          
          {/* Primary Action */}
          <button
            onClick={onNavigate}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            <span>🧭</span>
            Destination
          </button>
        </div>
        
        {/* Expanded Details - Only Visible When Expanded */}
        {isExpanded && (
          <div className="mt-6 space-y-4 pb-6 overflow-y-auto max-h-[50vh]">
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-gray-400">📍</span>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-gray-600">{pharmacy.address}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-gray-400">🕐</span>
                <div>
                  <p className="text-sm font-medium">Hours</p>
                  <p className="text-sm text-gray-600">
                    {pharmacy.openTime} - {pharmacy.closeTime}
                  </p>
                </div>
              </div>
              
              {/* Additional details... */}
            </div>
          </div>
        )}
        
        {/* Expand/Collapse Hint */}
        {!isExpanded && (
          <div className="text-center mt-2">
            <p className="text-xs text-gray-400">
              Swipe up for more details ↑
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

#### C. Mobile-Safe Area Support

**Add to bottom sheet:**
```typescript
// Account for iPhone notch and home indicator
className="pb-safe" // Uses safe-area-inset-bottom

// In globals.css or tailwind config:
@supports (padding: max(0px)) {
  .pb-safe {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}
```

---

### Fix 2: Auto-Center Map on Selected Pharmacy

#### A. Map Centering Logic

**File:** `features/patient/components/medicine-search/pharmacy-map.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'

interface MapCenterControllerProps {
  selectedPharmacy: {
    lat: number
    lng: number
  } | null
  userLocation: {
    lat: number
    lng: number
  } | null
}

// Component to handle map centering
function MapCenterController({ selectedPharmacy, userLocation }: MapCenterControllerProps) {
  const map = useMap()
  
  useEffect(() => {
    if (selectedPharmacy) {
      // When pharmacy is selected, center map on it
      map.flyTo(
        [selectedPharmacy.lat, selectedPharmacy.lng],
        15, // Zoom level for detail view
        {
          duration: 1.2, // Smooth animation
          easeLinearity: 0.25
        }
      )
    } else if (userLocation) {
      // No selection, show user location
      map.flyTo(
        [userLocation.lat, userLocation.lng],
        13, // Wider view
        {
          duration: 1.0
        }
      )
    }
  }, [selectedPharmacy, userLocation, map])
  
  // Auto-fit bounds to show both user and selected pharmacy
  useEffect(() => {
    if (selectedPharmacy && userLocation) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [selectedPharmacy.lat, selectedPharmacy.lng]
      ])
      
      // Fit both points with padding
      map.fitBounds(bounds, {
        padding: [50, 50], // 50px padding
        maxZoom: 14
      })
    }
  }, [selectedPharmacy, userLocation, map])
  
  return null
}

export function PharmacyMap({
  pharmacies,
  selectedPharmacyId,
  userLocation,
  onSelectPharmacy
}: PharmacyMapProps) {
  const selectedPharmacy = pharmacies.find(p => p.id === selectedPharmacyId)
  
  return (
    <MapContainer
      center={[35.7595, -5.834]} // Initial center (Tangier)
      zoom={13}
      className="h-full w-full"
      zoomControl={false} // Hide default zoom control (add custom)
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {/* User Location Marker */}
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#60a5fa',
            fillOpacity: 0.9,
            weight: 3
          }}
        />
      )}
      
      {/* Pharmacy Markers */}
      {pharmacies.map(pharmacy => {
        const isSelected = pharmacy.id === selectedPharmacyId
        
        return (
          <CircleMarker
            key={pharmacy.id}
            center={[pharmacy.lat, pharmacy.lng]}
            radius={isSelected ? 12 : 8}
            pathOptions={{
              color: pharmacy.isOnDuty ? '#f59e0b' : '#10b981',
              fillColor: pharmacy.isOnDuty ? '#fbbf24' : '#34d399',
              fillOpacity: isSelected ? 1 : 0.7,
              weight: isSelected ? 4 : 2
            }}
            eventHandlers={{
              click: () => onSelectPharmacy(pharmacy.id)
            }}
          >
            {/* Pulse animation for selected marker */}
            {isSelected && (
              <div className="animate-ping absolute h-full w-full rounded-full bg-teal-400 opacity-75" />
            )}
          </CircleMarker>
        )
      })}
      
      {/* Auto-centering controller */}
      <MapCenterController
        selectedPharmacy={selectedPharmacy ? {
          lat: selectedPharmacy.lat,
          lng: selectedPharmacy.lng
        } : null}
        userLocation={userLocation}
      />
    </MapContainer>
  )
}
```

#### B. Visual Feedback for Selected Pharmacy

**Add pulse animation to selected marker:**

```typescript
// In tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    }
  }
}

// Use on selected marker
className="animate-ping-slow"
```

#### C. Ensure Map Viewport Accounts for Bottom Sheet

```typescript
// Calculate map padding based on bottom sheet height
const MAP_BOTTOM_PADDING = isCompact ? '35vh' : '85vh'

// Apply to map container
<div 
  className="absolute inset-0"
  style={{
    paddingBottom: MAP_BOTTOM_PADDING
  }}
>
  <PharmacyMap ... />
</div>
```

---

### Fix 3: Improved Layout Structure

#### A. Full-Screen Map with Overlay Sheet

**File:** `app/patient/medicine-search/page.tsx`

```typescript
export default function MedicineSearchPage() {
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null)
  
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Search Bar - Fixed at Top */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-white/95 backdrop-blur shadow-sm">
        <SearchBar onSearch={handleSearch} />
      </div>
      
      {/* Map - Full Screen Background */}
      <div className="absolute inset-0 z-0">
        <PharmacyMap
          pharmacies={results}
          selectedPharmacyId={selectedPharmacyId}
          userLocation={userLocation}
          onSelectPharmacy={setSelectedPharmacyId}
        />
      </div>
      
      {/* Bottom Sheet - Overlay */}
      {selectedPharmacyId && (
        <PharmacyBottomSheet
          pharmacy={results.find(p => p.id === selectedPharmacyId)!}
          onClose={() => setSelectedPharmacyId(null)}
          onNavigate={() => navigateToPharmacy(selectedPharmacyId)}
        />
      )}
      
      {/* Results List - Alternative to Bottom Sheet */}
      {!selectedPharmacyId && results.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 max-h-[40vh] overflow-y-auto bg-white/95 backdrop-blur rounded-t-3xl shadow-2xl">
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-gray-900">
              {results.length} pharmacies found
            </h3>
            {results.slice(0, 3).map(pharmacy => (
              <button
                key={pharmacy.id}
                onClick={() => setSelectedPharmacyId(pharmacy.id)}
                className="w-full text-left p-3 rounded-xl bg-white hover:bg-gray-50 border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{pharmacy.name}</p>
                    <p className="text-sm text-gray-500">{pharmacy.distance.toFixed(1)} km</p>
                  </div>
                  {pharmacy.isOnDuty && (
                    <span className="text-teal-600 text-xs font-medium">
                      • On duty
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Testing Checklist

### Bottom Sheet Behavior ✅
- [ ] Default height is 35% of screen (compact)
- [ ] Map is clearly visible above sheet (65% screen)
- [ ] Swipe up gesture expands sheet to 85%
- [ ] Swipe down gesture collapses sheet to 35%
- [ ] Swipe handle is visible and draggable
- [ ] Transition animation is smooth (300ms)
- [ ] Safe area padding on iPhone (notch + home bar)

### Map Centering ✅
- [ ] Selecting pharmacy auto-centers map
- [ ] Animation is smooth (1.2s flyTo)
- [ ] Zoom level shows pharmacy clearly (zoom 15)
- [ ] Selected marker is visually distinct (larger + pulse)
- [ ] Map bounds fit both user + pharmacy when selected
- [ ] No manual scrolling needed to see destination

### Visual Feedback ✅
- [ ] Selected marker has pulse animation
- [ ] Selected marker is larger than others
- [ ] Color differentiation (garde = amber, regular = green)
- [ ] User location marker is distinct (blue)
- [ ] "Destination" button is prominent
- [ ] Bottom sheet has shadow for depth

### Mobile Experience ✅
- [ ] Touch gestures work smoothly
- [ ] No content hidden behind notch/home bar
- [ ] Sheet doesn't cover map unnecessarily
- [ ] One-handed operation possible
- [ ] Loading states don't block interaction

---

## Before & After Comparison

### Before (Problematic) ❌
```
┌─────────────────────┐
│   Map (Hidden)      │ ← Only 50% visible
├─────────────────────┤
│                     │
│  Bottom Sheet       │
│  (Too Large)        │ ← Covers 50% of screen
│                     │
│  • Pharmacy Details │
│  • Address          │
│  • Hours            │
│  • Medicine         │
│                     │
│  [Destination]      │
└─────────────────────┘

Issues:
- User can't see map and pharmacy simultaneously
- Map doesn't center on destination
- Too much scrolling required
```

### After (Fixed) ✅
```
┌─────────────────────┐
│                     │
│   Map (Centered)    │ ← 65% visible
│   🔵 User           │   Pharmacy is centered
│   💊 Pharmacy ✨    │   Auto-zoomed
│                     │
├─────────────────────┤
│ ┌─ Pharmacy Info   │
│ │  Name             │ ← Compact 35%
│ │  • On duty • 3km │   Key info only
│ │  💊 DOLIPRANE     │
│ └─ [Destination] ───│
│ Swipe up for more ↑│
└─────────────────────┘

Improvements:
✅ Map prominently displayed
✅ Auto-centered on destination
✅ Compact sheet shows key info
✅ Swipe to expand for details
```

---

## Implementation Priority

### P0 (Critical - Must Fix)
1. **Reduce bottom sheet height** to 35vh (compact state)
2. **Auto-center map** on selected pharmacy with flyTo animation
3. **Add swipe gesture** for expand/collapse

### P1 (High Priority)
4. Add pulse animation to selected marker
5. Implement safe-area padding for mobile
6. Add visual feedback for gestures

### P2 (Nice to Have)
7. Add haptic feedback on selection (iOS)
8. Add route visualization (optional)
9. Add mini-map toggle (show/hide sheet)

---

## Files to Modify

**MODIFY:**
```
app/patient/medicine-search/page.tsx
  - Restructure layout (map fullscreen, sheet overlay)
  - Add selected pharmacy state
  - Position sheet at bottom

features/patient/components/medicine-search/pharmacy-map.tsx
  - Add MapCenterController component
  - Implement flyTo animation
  - Add fitBounds for user + pharmacy

features/patient/components/medicine-search/pharmacy-bottom-sheet.tsx
  - CREATE NEW COMPONENT
  - Compact default state (35vh)
  - Swipe-to-expand gesture
  - Smooth transitions
```

**CREATE:**
```
features/patient/components/medicine-search/pharmacy-bottom-sheet.tsx
  - Swipeable sheet component
  - Compact/expanded states
  - Touch gesture handlers
```

---

## Success Criteria

✅ **Map is the hero** - Takes 65% of screen by default
✅ **Auto-centering works** - No manual scrolling needed
✅ **Smooth animations** - flyTo and sheet transitions feel native
✅ **Compact sheet** - Shows key info without hiding map
✅ **Swipe to expand** - Users can get more details when needed
✅ **Mobile-first** - Safe areas respected, gestures intuitive
✅ **Visual hierarchy** - Selected pharmacy is obvious

---

## Additional UX Enhancements

### A. Add Zoom Controls
```typescript
// Custom zoom buttons (better than default)
<div className="absolute top-20 right-4 z-30 space-y-2">
  <button
    onClick={() => map.zoomIn()}
    className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
  >
    +
  </button>
  <button
    onClick={() => map.zoomOut()}
    className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
  >
    −
  </button>
</div>
```

### B. Add "Close" Button to Sheet
```typescript
// X button in top-right of compact sheet
<button
  onClick={() => setSelectedPharmacyId(null)}
  className="absolute top-4 right-4 text-gray-400"
>
  ✕
</button>
```

### C. Add Loading State
```typescript
// While map is centering
{isCentering && (
  <div className="absolute inset-0 z-40 bg-black/10 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
  </div>
)}
```

---

## Demo Account

Test with:
```
Email: fatima@locatomed.ma
Password: demo123
```

Search for: "DOLIPRANE"

Expected behavior:
1. Results appear with compact bottom sheet (35% height)
2. Map is clearly visible (65% height)
3. Clicking pharmacy auto-centers map smoothly
4. Swiping up expands sheet to 85%
5. Swiping down collapses back to 35%
6. Selected marker pulses and is centered
7. No manual map scrolling needed
