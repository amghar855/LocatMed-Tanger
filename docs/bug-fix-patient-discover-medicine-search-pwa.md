# Bug Fix - Patient Discover Medicine Search: PWA Android-First UX

## Context

You're fixing critical UX issues in the **Patient Discover** feature (`/patient/discover`) after a medicine search, specifically when `view=pharmacies` and a medicine query is active. This is a **PWA Android-first** mobile experience that must feel native and responsive.

**Critical Design Constraint:** This is a mobile PWA for Android users searching for medicines while on the street. Every interaction must be optimized for one-handed use, touch gestures, and quick scanning.

---

## Current Architecture (From pharma_process.md)

```
app/patient/discover/page.tsx (Server)
  └── DiscoverClient (Client)
        ├── DiscoverMapLeaflet (Map with OSRM routing)
        └── Bottom Sheet (Swipe-to-dismiss)
```

**Key Features Already Working:**
- ✅ OSRM road routing (no API key)
- ✅ Auto-select best pharmacy on medicine search
- ✅ Haversine distance calculation
- ✅ Two-way zoom ↔ radius sync
- ✅ Custom facility markers (pharmacy on-duty = amber)
- ✅ Swipe-to-dismiss bottom sheet

---

## Critical UX Issues to Fix

### Issue 1: Bottom Sheet Height (Mobile PWA Critical) ❌

**Current Behavior:**
- Bottom sheet slides from `translateY(100%)` to `translateY(0)`
- Takes full available height when open
- Hides map completely
- User cannot see pharmacy location and details simultaneously

**Problem for PWA Android:**
- Mobile users need to see both map AND pharmacy info
- Current sheet forces context switching (close sheet → see map → reopen sheet)
- Not optimized for one-handed operation
- Violates mobile-first principle: "map is the hero"

**Required Fix:**
```
Mobile Layout (Portrait):
┌─────────────────────┐
│                     │
│   Map (65%)         │  ← Prominently displayed
│   🔵 User           │
│   💊 Pharmacy ✨    │
│   (Auto-centered)   │
├─────────────────────┤
│ ┌─ Pharmacy Info   │
│ │  Compact (35%)    │  ← Essential info only
│ │  • Name           │
│ │  • On duty badge  │
│ │  • Distance       │
│ │  • Medicine       │
│ │  [Destination] ───│
│ Swipe up for more ↑│
└─────────────────────┘
```

**Specifications:**
- Default height: **35vh** (35% of viewport)
- Expanded height: **85vh** (when user swipes up)
- Swipe handle: 12px wide × 1.5px tall gray bar
- Smooth transition: 300ms ease-out
- Safe area padding: Account for Android navigation bar
- Backdrop: Semi-transparent when expanded (optional)

### Issue 2: Map Not Auto-Centered on Search Result ❌

**Current Behavior (From pharma_process.md):**
- Auto-select best pharmacy works (`useEffect` on `committedQuery`)
- `directionTarget` is set when pharmacy is selected
- `FlyToSelection` component exists in map
- But pharmacy marker may still be off-screen or obscured by bottom sheet

**Problem for PWA Android:**
- User searches "DOLIPRANE"
- Best pharmacy is auto-selected
- Route is drawn
- But user must manually pan map to see the destination
- Bottom sheet covers the marker

**Required Fix:**

#### A. Ensure FlyTo Accounts for Bottom Sheet
```typescript
// In DiscoverMapLeaflet > FlyToSelection component
const BOTTOM_SHEET_HEIGHT_COMPACT = 0.35 // 35vh
const BOTTOM_SHEET_HEIGHT_EXPANDED = 0.85 // 85vh

useEffect(() => {
  if (selectedId) {
    const item = items.find(i => i.id === selectedId)
    if (item) {
      // Calculate offset to center marker in visible map area (above sheet)
      const viewportHeight = map.getContainer().clientHeight
      const sheetHeight = viewportHeight * BOTTOM_SHEET_HEIGHT_COMPACT
      const visibleMapHeight = viewportHeight - sheetHeight
      
      // Pan so marker is centered in visible area
      const centerOffset = sheetHeight / 2 / viewportHeight
      
      map.flyTo(
        [item.lat, item.lng],
        15, // Detail zoom
        {
          duration: 1.2,
          easeLinearity: 0.25,
          // Offset to account for bottom sheet
          paddingBottomRight: [0, sheetHeight]
        }
      )
    }
  }
}, [selectedId, items, map])
```

#### B. FitBounds for User + Pharmacy Route
```typescript
// When both user location and selected pharmacy exist
useEffect(() => {
  if (selectedPharmacy && userLocation) {
    const bounds = L.latLngBounds([
      [userLocation.lat, userLocation.lng],
      [selectedPharmacy.lat, selectedPharmacy.lng]
    ])
    
    // Fit with bottom sheet consideration
    map.fitBounds(bounds, {
      paddingTopLeft: [20, 20],
      paddingBottomRight: [20, window.innerHeight * 0.35 + 20],
      maxZoom: 14
    })
  }
}, [selectedPharmacy, userLocation, map])
```

### Issue 3: Selected Marker Visual Feedback ❌

**Current Implementation:**
- Selected marker size: 34px
- Nearest qualified: 31px  
- Default: 28px

**Problem:**
- Size difference too subtle on mobile (small screen)
- No pulsing/animation to draw attention
- Hard to spot at a glance

**Required Fix:**
```typescript
// In marker rendering
const isSelected = item.id === selectedId

<Marker
  position={[item.lat, item.lng]}
  icon={createFacilityIcon({
    type: item.type,
    isOnDuty: item.isOnDuty,
    isSelected,
    size: isSelected ? 40 : 28, // Larger difference
  })}
>
  {/* Add pulse animation for selected */}
  {isSelected && (
    <div 
      className="absolute inset-0 rounded-full animate-ping"
      style={{
        backgroundColor: item.isOnDuty ? '#f59e0b' : '#06b6d4',
        opacity: 0.4
      }}
    />
  )}
</Marker>
```

### Issue 4: Bottom Sheet Content for PWA ❌

**Current Content (Too Verbose for Mobile):**
- All pharmacy details shown immediately
- Medicine availability list can be long
- Action buttons not prominent enough

**Required Fix - Compact Mode (35vh):**

```typescript
interface CompactPharmacySheetProps {
  pharmacy: PharmacyDiscover & { distanceKm: number }
  committedQuery: string
  onExpand: () => void
  onNavigate: () => void
  onClose: () => void
}

export function CompactPharmacySheet({
  pharmacy,
  committedQuery,
  onExpand,
  onNavigate,
  onClose
}: CompactPharmacySheetProps) {
  const hasMedicine = pharmacy.availableMedicines.includes(committedQuery)
  
  return (
    <div className="p-4 pb-safe space-y-3">
      {/* Swipe Handle */}
      <div className="flex justify-center -mt-2 mb-2">
        <button
          onClick={onExpand}
          className="w-12 h-1.5 bg-gray-300 rounded-full active:bg-gray-400"
        />
      </div>
      
      {/* Quick Info - One Row */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">
            {pharmacy.name}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {pharmacy.neighborhood}
          </p>
        </div>
        
        <button 
          onClick={onClose}
          className="ml-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          ✕
        </button>
      </div>
      
      {/* Badges Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {pharmacy.isOnDuty && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
            🌙 De garde
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
          📍 {pharmacy.distanceKm.toFixed(1)} km
        </span>
        {hasMedicine ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
            ✓ {committedQuery} disponible
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-800 text-xs font-medium rounded-full">
            ✗ {committedQuery} indisponible
          </span>
        )}
      </div>
      
      {/* Primary Action - LARGE Touch Target */}
      <button
        onClick={onNavigate}
        className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:shadow-none transition-all touch-manipulation"
      >
        <span className="text-xl">🧭</span>
        <span className="text-lg">Destination</span>
      </button>
      
      {/* Swipe Hint */}
      <p className="text-center text-xs text-gray-400">
        Balayez vers le haut pour plus de détails ↑
      </p>
    </div>
  )
}
```

**Required Fix - Expanded Mode (85vh):**

```typescript
export function ExpandedPharmacySheet({
  pharmacy,
  committedQuery,
  onCollapse,
  onNavigate,
  onClose
}: ExpandedPharmacySheetProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-none p-4 border-b">
        <div className="flex justify-center -mt-2 mb-3">
          <button
            onClick={onCollapse}
            className="w-12 h-1.5 bg-gray-300 rounded-full"
          />
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="font-bold text-xl">{pharmacy.name}</h2>
            <p className="text-sm text-gray-600">{pharmacy.address}</p>
          </div>
          <button onClick={onClose} className="ml-2 text-gray-400">
            ✕
          </button>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe space-y-4">
        {/* Status & Distance */}
        <div className="flex flex-wrap gap-2">
          {/* Same badges as compact mode */}
        </div>
        
        {/* Opening Hours */}
        <div className="space-y-1">
          <h4 className="font-semibold text-sm">Horaires</h4>
          <p className="text-sm text-gray-600">
            {pharmacy.openTime} - {pharmacy.closeTime}
          </p>
        </div>
        
        {/* Available Medicines */}
        {pharmacy.availableMedicines.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">
              Médicaments disponibles ({pharmacy.availableMedicines.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {pharmacy.availableMedicines.slice(0, 10).map(med => (
                <span
                  key={med}
                  className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    med === committedQuery
                      ? "bg-teal-100 text-teal-800 font-medium"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {med}
                </span>
              ))}
              {pharmacy.availableMedicines.length > 10 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{pharmacy.availableMedicines.length - 10} autres
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Phone */}
        {pharmacy.phone && (
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Téléphone</h4>
            <a
              href={`tel:${pharmacy.phone}`}
              className="text-teal-600 text-sm hover:underline"
            >
              {pharmacy.phone}
            </a>
          </div>
        )}
      </div>
      
      {/* Footer - Fixed Action */}
      <div className="flex-none p-4 border-t bg-white pb-safe">
        <button
          onClick={onNavigate}
          className="w-full bg-teal-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:bg-teal-700 transition-all touch-manipulation"
        >
          <span className="text-xl">🧭</span>
          <span className="text-lg">Destination</span>
        </button>
      </div>
    </div>
  )
}
```

---

## PWA Android-First Requirements

### 1. Touch Targets (Critical)
```typescript
// Minimum touch target: 44px × 44px (Apple HIG)
// Recommended for Android: 48dp = ~48px

// All interactive elements MUST meet this:
const TOUCH_TARGET_MIN = '44px'

// Primary actions even larger:
const PRIMARY_BUTTON_HEIGHT = '56px' // 14 * 4px = 3.5rem

// Apply to:
// - Destination button: py-4 (16px × 2 = 32px + text = ~56px total)
// - Close button: w-8 h-8 (32px) - TOO SMALL, increase to w-11 h-11 (44px)
// - Swipe handle: Entire top bar should be tappable for expand
```

### 2. Safe Area Support (Android Navigation Bar)
```css
/* Add to globals.css */
@supports (padding: max(0px)) {
  .pb-safe {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  
  .mb-safe {
    margin-bottom: max(0.5rem, env(safe-area-inset-bottom));
  }
}

/* Apply to bottom sheet footer */
<div className="pb-safe">
  <button>Destination</button>
</div>
```

### 3. Smooth Touch Animations
```typescript
// Use hardware-accelerated transforms
className="transition-transform duration-300 ease-out"
style={{ transform: `translateY(${isExpanded ? '0' : '65vh'})` }}

// NOT:
className="transition-all" // Forces layout recalculation
style={{ height: isExpanded ? '85vh' : '35vh' }} // Causes jank
```

### 4. One-Handed Operation
```
Thumb Zone Analysis (Right-Handed):
┌─────────────────────┐
│                     │ ← Hard to reach
│   Map               │
│   (View only)       │
│                     │
├─────────────────────┤
│ [Destination] ──────│ ← Easy to reach
│ Swipe handle ───────│ ← Easy to reach
└─────────────────────┘

Bottom sheet controls MUST be in thumb-reachable zone
```

### 5. Visual Feedback (Android Material Design)
```typescript
// Ripple effect on buttons (native Android feel)
import { cn } from '@/lib/utils'

<button
  className={cn(
    "relative overflow-hidden", // For ripple
    "active:bg-teal-700", // Immediate feedback
    "transition-colors duration-150", // Smooth
    "touch-manipulation" // Disable 300ms delay
  )}
  onClick={handleClick}
>
  {/* Content */}
</button>

// Add ripple with Tailwind plugin or custom CSS
```

### 6. Loading States (Prevent Interaction Confusion)
```typescript
const [isNavigating, setIsNavigating] = useState(false)

const handleNavigate = async () => {
  setIsNavigating(true)
  try {
    // Trigger route drawing
    await onNavigate()
  } finally {
    setIsNavigating(false)
  }
}

<button
  onClick={handleNavigate}
  disabled={isNavigating}
  className={cn(
    "w-full py-4 rounded-xl",
    isNavigating 
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-teal-500 active:bg-teal-700"
  )}
>
  {isNavigating ? (
    <>
      <span className="inline-block animate-spin mr-2">⏳</span>
      Chargement...
    </>
  ) : (
    <>
      <span>🧭</span> Destination
    </>
  )}
</button>
```

### 7. Swipe Gesture Refinement
```typescript
// Current implementation has basic swipe-to-dismiss
// Enhance for Android PWA:

interface SwipeState {
  startY: number
  currentY: number
  isDragging: boolean
}

const [swipeState, setSwipeState] = useState<SwipeState>({
  startY: 0,
  currentY: 0,
  isDragging: false
})

const handleTouchStart = (e: React.TouchEvent) => {
  setSwipeState({
    startY: e.touches[0].clientY,
    currentY: e.touches[0].clientY,
    isDragging: true
  })
}

const handleTouchMove = (e: React.TouchEvent) => {
  if (!swipeState.isDragging) return
  
  const currentY = e.touches[0].clientY
  const deltaY = currentY - swipeState.startY
  
  // Only allow downward swipe when at top of scroll
  const scrollContainer = e.currentTarget.querySelector('.overflow-y-auto')
  if (scrollContainer && scrollContainer.scrollTop > 0) {
    return // Let scroll happen naturally
  }
  
  // Update drag position with rubber-banding
  if (deltaY > 0) {
    setSwipeState(prev => ({ ...prev, currentY }))
  }
}

const handleTouchEnd = () => {
  const deltaY = swipeState.currentY - swipeState.startY
  
  // Threshold for dismiss: 80px or 15% of viewport
  const dismissThreshold = Math.max(80, window.innerHeight * 0.15)
  
  if (deltaY > dismissThreshold) {
    onClose() // Dismiss sheet
  } else if (deltaY < -dismissThreshold) {
    onExpand() // Expand sheet (swipe up)
  }
  
  // Reset state
  setSwipeState({ startY: 0, currentY: 0, isDragging: false })
}

// Apply dynamic transform during drag
const dragOffset = Math.max(0, swipeState.currentY - swipeState.startY)
style={{
  transform: `translateY(${dragOffset}px)`,
  transition: swipeState.isDragging ? 'none' : 'transform 300ms ease-out'
}}
```

---

## Implementation Files

### Files to Modify

**1. `features/patient/components/discover/discover-client.tsx`**
```typescript
// Add bottom sheet state management
const [sheetExpanded, setSheetExpanded] = useState(false)

// Pass to bottom sheet component
<PharmacyBottomSheet
  pharmacy={selectedPharmacy}
  isExpanded={sheetExpanded}
  onExpand={() => setSheetExpanded(true)}
  onCollapse={() => setSheetExpanded(false)}
  onClose={() => {
    setSelectedId(null)
    setSheetExpanded(false)
  }}
  onNavigate={handleShowRouteInMap}
  committedQuery={committedQuery}
/>
```

**2. `features/patient/components/discover/discover-map-leaflet.tsx`**
```typescript
// Update FlyToSelection to account for bottom sheet
const FlyToSelection = ({ selectedId, items, isSheetExpanded }) => {
  const map = useMap()
  
  useEffect(() => {
    if (selectedId) {
      const item = items.find(i => i.id === selectedId)
      if (item) {
        const sheetHeight = window.innerHeight * (isSheetExpanded ? 0.85 : 0.35)
        
        map.flyTo(
          [item.lat, item.lng],
          15,
          {
            duration: 1.2,
            easeLinearity: 0.25,
            paddingBottomRight: [0, sheetHeight]
          }
        )
      }
    }
  }, [selectedId, items, isSheetExpanded, map])
  
  return null
}

// Add pulse animation to selected marker
{isSelected && (
  <div
    className="absolute inset-0 animate-ping rounded-full"
    style={{
      backgroundColor: isOnDuty ? '#f59e0b' : '#06b6d4',
      opacity: 0.3
    }}
  />
)}
```

**3. CREATE: `features/patient/components/discover/pharmacy-bottom-sheet.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { PharmacyDiscover } from '@/features/patient/types/discover'

interface PharmacyBottomSheetProps {
  pharmacy: (PharmacyDiscover & { distanceKm: number }) | null
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
  onClose: () => void
  onNavigate: () => void
  committedQuery: string
}

export function PharmacyBottomSheet({
  pharmacy,
  isExpanded,
  onExpand,
  onCollapse,
  onClose,
  onNavigate,
  committedQuery
}: PharmacyBottomSheetProps) {
  const [swipeState, setSwipeState] = useState({
    startY: 0,
    currentY: 0,
    isDragging: false
  })
  
  if (!pharmacy) return null
  
  const hasMedicine = pharmacy.availableMedicines.includes(committedQuery)
  const dragOffset = Math.max(0, swipeState.currentY - swipeState.startY)
  
  return (
    <>
      {/* Backdrop (when expanded) */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onCollapse}
        />
      )}
      
      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white rounded-t-3xl shadow-2xl",
          "transition-all duration-300 ease-out",
          isExpanded ? "h-[85vh]" : "h-[35vh]"
        )}
        style={{
          transform: `translateY(${swipeState.isDragging ? dragOffset : 0}px)`,
          transition: swipeState.isDragging ? 'none' : 'height 300ms ease-out, transform 300ms ease-out'
        }}
        onTouchStart={(e) => {
          setSwipeState({
            startY: e.touches[0].clientY,
            currentY: e.touches[0].clientY,
            isDragging: true
          })
        }}
        onTouchMove={(e) => {
          if (!swipeState.isDragging) return
          setSwipeState(prev => ({
            ...prev,
            currentY: e.touches[0].clientY
          }))
        }}
        onTouchEnd={() => {
          const deltaY = swipeState.currentY - swipeState.startY
          const threshold = window.innerHeight * 0.15
          
          if (deltaY > threshold && !isExpanded) {
            onClose()
          } else if (deltaY < -threshold && !isExpanded) {
            onExpand()
          } else if (deltaY > threshold && isExpanded) {
            onCollapse()
          }
          
          setSwipeState({ startY: 0, currentY: 0, isDragging: false })
        }}
      >
        {isExpanded ? (
          <ExpandedPharmacySheet
            pharmacy={pharmacy}
            committedQuery={committedQuery}
            onCollapse={onCollapse}
            onNavigate={onNavigate}
            onClose={onClose}
          />
        ) : (
          <CompactPharmacySheet
            pharmacy={pharmacy}
            committedQuery={committedQuery}
            onExpand={onExpand}
            onNavigate={onNavigate}
            onClose={onClose}
          />
        )}
      </div>
    </>
  )}
}

// CompactPharmacySheet and ExpandedPharmacySheet components here
// (Use code from Issue 4 above)
```

**4. `app/globals.css`**
```css
/* Add safe area support */
@supports (padding: max(0px)) {
  .pb-safe {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  
  .mb-safe {
    margin-bottom: max(0.5rem, env(safe-area-inset-bottom));
  }
}

/* Touch manipulation - disable 300ms delay */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Smooth scroll for sheet content */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

---

## Testing Checklist (PWA Android Focus)

### Bottom Sheet ✅
- [ ] Default height: 35vh (map visible at 65vh)
- [ ] Swipe up expands to 85vh
- [ ] Swipe down collapses to 35vh
- [ ] Swipe down in compact mode dismisses sheet
- [ ] Smooth animations (300ms)
- [ ] Safe area padding on bottom (Android nav bar)
- [ ] No jank during transitions
- [ ] Backdrop appears when expanded

### Map Centering ✅
- [ ] Selected pharmacy auto-centered in visible area
- [ ] Map accounts for bottom sheet height
- [ ] Route (OSRM) shows full path user → pharmacy
- [ ] fitBounds includes both markers with padding
- [ ] No manual scrolling needed

### Visual Feedback ✅
- [ ] Selected marker: 40px (larger than default 28px)
- [ ] Pulse animation on selected marker
- [ ] Color: amber for on-duty, cyan for regular
- [ ] User location marker distinct (blue)
- [ ] Touch feedback on all buttons (active states)

### Touch Targets ✅
- [ ] All buttons minimum 44px height
- [ ] Primary action (Destination): 56px height
- [ ] Close button: 44px × 44px
- [ ] Swipe handle tappable for expand

### PWA Behavior ✅
- [ ] Works offline (cached tiles)
- [ ] No 300ms tap delay
- [ ] Smooth scrolling in expanded sheet
- [ ] One-handed operation possible
- [ ] Loading states prevent double-tap
- [ ] Haptic feedback on actions (if supported)

### Android-Specific ✅
- [ ] Safe area respected (no content behind nav bar)
- [ ] Material Design ripple effects
- [ ] Swipe gestures feel native
- [ ] Back button closes sheet (not app)
- [ ] Portrait orientation optimized
- [ ] Works with gesture navigation

---

## Success Criteria

✅ **Map is the hero:** 65% visible by default, auto-centered on destination
✅ **One-handed operation:** All controls in thumb zone, large touch targets
✅ **Smooth animations:** 60fps transitions, hardware-accelerated
✅ **Native feel:** Swipe gestures, Material Design patterns, no tap delay
✅ **Context preservation:** User sees map AND pharmacy details simultaneously
✅ **PWA optimized:** Safe areas, offline support, fast interactions
✅ **No manual work:** Auto-center, auto-select, auto-route draw

---

## Priority Order

### P0 (Critical - Must Fix First)
1. Reduce bottom sheet to 35vh compact mode
2. Add swipe-to-expand gesture (35vh ↔ 85vh)
3. Fix map centering to account for sheet height
4. Increase touch targets to 44px minimum

### P1 (High Priority)
5. Add pulse animation to selected marker
6. Implement safe area padding (Android nav bar)
7. Add loading states to prevent confusion
8. Optimize swipe gesture (rubber-banding, thresholds)

### P2 (Nice to Have)
9. Add backdrop when expanded
10. Add haptic feedback (if available)
11. Optimize for landscape orientation
12. Add mini-map toggle option

---

## Usage Prompt

```
Read bug-fix-patient-discover-medicine-search-pwa.md and fix the medicine search UX for PWA Android users. Implement: (1) compact bottom sheet at 35vh with swipe-to-expand to 85vh, (2) auto-center map on selected pharmacy accounting for sheet height, (3) large touch targets (44px min), (4) safe area padding for Android nav bar, (5) pulse animation on selected marker. This is mobile-first - map must be the hero (65% visible). Preserve all existing functionality and design language.
```

---

## Demo Test

**Device:** Android phone (Chrome PWA installed)
**Account:** `fatima@locatomed.ma` / `demo123`

**Steps:**
1. Navigate to `/patient/discover?view=pharmacies`
2. Search for "DOLIPRANE"
3. Verify auto-select triggers
4. **Check:** Map shows 65%, sheet shows 35%
5. **Check:** Pharmacy is centered in visible map area
6. **Check:** Route is drawn and fully visible
7. Swipe up on sheet
8. **Check:** Expands to 85vh smoothly
9. Swipe down
10. **Check:** Collapses to 35vh
11. Swipe down again in compact mode
12. **Check:** Sheet dismisses
13. Tap "Destination" button
14. **Check:** Route draws, map centers
15. Test one-handed - all actions reachable with thumb

**Expected:** Smooth, native-feeling Android app experience!
