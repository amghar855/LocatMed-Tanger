# Claude Code Prompt - Pharmacy Finder & Stock Management

## Project Context

You're working on **LOCATOMED**, a multi-role healthcare platform for Morocco built with:
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **shadcn/ui** components
- **Drizzle ORM** with SQLite
- **Auth.js** (NextAuth v5)
- **Leaflet** for interactive maps

## Current State

✅ **Already Working:**
- Complete authentication system with role-based login
- Database schema with: users, pharmacies, medicines, pharmacyStock
- Rich seed data (158 pharmacies in Tangier, 49 medicines, full stock matrix)
- Route protection and role-based redirects
- shadcn/ui components already installed
- Pharmacist can log in at `/pharmacy/login`

❌ **Not Yet Built (Your Tasks):**
- Public medicine search interface with pharmacy availability
- Interactive map showing pharmacies with stock
- Pharmacist stock management dashboard
- Reservation system for citizens
- Low stock alerts and notifications

## Your Mission

Implement TWO interconnected features:

### 1. Public Pharmacy Finder (`/search`)
- Medicine search with real-time pharmacy availability
- Interactive map showing pharmacies with stock
- Pharmacy detail cards with contact info and hours
- Route visualization from user location to pharmacy
- Reservation system for citizens
- "Notify me" waitlist for out-of-stock items

### 2. Pharmacist Stock Management (`/pharmacy/*`)
- Dashboard with inventory overview
- Stock management interface (update quantities, prices)
- Low stock alerts
- Reservation management (accept/reject)
- Duty pharmacy (garde) status toggle

---

## Files to Create

```
lib/actions/
├── medicine-search-actions.ts         # CREATE - Public search & pharmacy finder
├── pharmacy-stock-actions.ts          # CREATE - Pharmacist inventory management
└── reservation-actions.ts             # CREATE - Reservation system

components/locatomed/
├── medicine-search.tsx                # CREATE - Search bar with autocomplete
├── pharmacy-map.tsx                   # CREATE - Leaflet map with markers
├── pharmacy-card.tsx                  # CREATE - Pharmacy availability card
├── route-map.tsx                      # CREATE - Route visualization
├── stock-table.tsx                    # CREATE - Pharmacist stock management table
└── reservation-list.tsx               # CREATE - Pharmacist reservation list

app/
├── search/
│   └── page.tsx                       # CREATE - Public medicine search page
└── pharmacy/
    ├── page.tsx                       # MODIFY - Pharmacist dashboard
    ├── stock/
    │   └── page.tsx                   # CREATE - Stock management page
    ├── reservations/
    │   └── page.tsx                   # CREATE - Reservation management
    └── settings/
        └── page.tsx                   # CREATE - Pharmacy settings (garde status)
```

---

## Database Schema Reference

You have these tables available:

```typescript
// Pharmacies table
pharmacies: {
  id: number
  name: string
  address: string
  city: string
  phone?: string
  whatsapp?: string
  latitude?: number
  longitude?: number
  openTime?: string     // e.g., "08:00"
  closeTime?: string    // e.g., "20:00"
  isGarde: boolean      // Duty pharmacy (open weekends/nights)
  createdAt: Date
}

// Medicines table
medicines: {
  id: number
  name: string
  activeIngredient: string  // DCI
  form: string
  dosage?: string
  barcode?: string
  isControlled: boolean
}

// PharmacyStock table (inventory/stock levels)
pharmacyStock: {
  id: number
  pharmacyId: number
  medicineId: number
  quantity: number
  price?: number
  expiryDate?: Date
  minThreshold: number     // Low stock alert threshold
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  lastConfirmedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Reservations table (citizen reservations)
reservations: {
  id: number
  pharmacyId: number
  medicineId: number
  userId?: number          // If authenticated user
  citizenName: string      // For non-authenticated users
  citizenPhone: string
  status: 'PENDING' | 'CONFIRMED' | 'COLLECTED' | 'CANCELLED'
  createdAt: Date
  updatedAt: Date
}

// NotificationRequests table (waitlist for out-of-stock)
notificationRequests: {
  id: number
  pharmacyId: number
  medicineId: number
  email?: string
  phoneNumber?: string
  status: 'PENDING' | 'SENT'
  createdAt: Date
}
```

---

## Part 1: Public Pharmacy Finder

### Feature 1.1: Medicine Search Page (`app/search/page.tsx`)

**Requirements:**
- [ ] Public page (no auth required)
- [ ] Hero section with search bar
- [ ] Title: "Trouvez Vos Médicaments" 
- [ ] Subtitle: "Recherchez et localisez les pharmacies qui ont vos médicaments en stock"
- [ ] Large search input with medicine autocomplete
- [ ] Search triggers on input (debounced, minimum 2 characters)
- [ ] Results section showing:
  - Medicine info card (name, form, dosage, DCI)
  - List of pharmacies with stock
  - Interactive map showing pharmacy locations
- [ ] Empty states for: no query, no results, no stock anywhere
- [ ] Must be a CLIENT COMPONENT (uses state)

**Server Actions Needed:**
- `searchMedicines(query)` - autocomplete for medicine search
- `findPharmaciesWithStock(medicineId)` - returns pharmacies that have this medicine

**UI Flow:**
1. User types medicine name
2. Autocomplete dropdown appears
3. User selects medicine
4. Page shows:
   - Medicine details at top
   - Map with pharmacy markers on left
   - List of pharmacy cards on right
   - Each pharmacy shows: name, address, stock status, price, distance

### Feature 1.2: Interactive Pharmacy Map (`components/locatomed/pharmacy-map.tsx`)

**Requirements:**
- [ ] Full Leaflet map integration
- [ ] Dark-themed map tiles (CARTO Dark Matter style)
- [ ] Custom markers for pharmacies:
  - Blue/cyan marker for regular pharmacies
  - Gold/amber marker for duty pharmacies (`isGarde: true`)
- [ ] Marker popups showing:
  - Pharmacy name
  - Address
  - Phone number
  - Opening hours
  - "DE GARDE" badge if `isGarde === true`
  - "Voir Détails" link
- [ ] Click marker to highlight corresponding pharmacy card
- [ ] Auto-center map on pharmacies with stock
- [ ] User location marker (if geolocation enabled)

**Technical Requirements:**
```typescript
'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom marker icons
const regularIcon = L.icon({
  iconUrl: '/markers/pharmacy-blue.png',
  iconSize: [32, 32],
})

const gardeIcon = L.icon({
  iconUrl: '/markers/pharmacy-gold.png', 
  iconSize: [32, 32],
})
```

### Feature 1.3: Route Visualization (`components/locatomed/route-map.tsx`)

**Requirements:**
- [ ] When user clicks "Get Directions" on pharmacy card
- [ ] Show map with route from user location to pharmacy
- [ ] Use `leaflet-routing-machine` for route drawing
- [ ] Display distance and estimated time
- [ ] Clean polyline styling (cyan/blue to match theme)
- [ ] "Close" button to return to search results

**Technical Implementation:**
```typescript
'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-routing-machine'

interface RouteMapProps {
  userLocation: [number, number]
  pharmacyLocation: [number, number]
}

export function RouteMap({ userLocation, pharmacyLocation }: RouteMapProps) {
  const map = useMap()
  
  useEffect(() => {
    if (!map) return
    
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(pharmacyLocation[0], pharmacyLocation[1])
      ],
      routeWhileDragging: false,
      show: false, // Hide turn-by-turn instructions
      lineOptions: {
        styles: [{ color: '#06b6d4', weight: 4 }]
      }
    }).addTo(map)
    
    return () => {
      map.removeControl(routingControl)
    }
  }, [map, userLocation, pharmacyLocation])
  
  return null
}
```

### Feature 1.4: Pharmacy Availability Card (`components/locatomed/pharmacy-card.tsx`)

**Requirements:**
- [ ] Card showing pharmacy details
- [ ] Stock status badge:
  - Green "Disponible" if quantity > minThreshold
  - Orange "Stock Faible" if 0 < quantity <= minThreshold
  - Red "Rupture de Stock" if quantity === 0
- [ ] Price display (if available)
- [ ] Contact info: phone, WhatsApp button
- [ ] Opening hours
- [ ] "DE GARDE" badge if isGarde
- [ ] Distance from user (if location available)
- [ ] Action buttons:
  - "Réserver" if in stock
  - "Me Notifier" if out of stock
  - "Itinéraire" to show route

### Feature 1.5: Reservation System

**Reservation Flow (Citizen):**
1. Click "Réserver" on pharmacy card
2. Modal opens with form:
   - Nom (required)
   - Téléphone (required)
   - Email (optional)
3. Submit creates reservation with status PENDING
4. Success message: "Réservation envoyée! La pharmacie vous contactera."

**Notification Request Flow (Out of Stock):**
1. Click "Me Notifier" on pharmacy card
2. Modal opens with form:
   - Email or Téléphone (at least one required)
3. Submit creates notification request
4. Success message: "Vous serez notifié quand ce médicament sera disponible"

---

## Part 2: Pharmacist Stock Management

### Feature 2.1: Pharmacist Dashboard (`app/pharmacy/page.tsx`)

**Requirements:**
- [ ] Auth required (pharmacist role only)
- [ ] Stat cards showing:
  - Total Medicines in Stock
  - Low Stock Items (quantity <= minThreshold)
  - Out of Stock Items
  - Pending Reservations
- [ ] Quick actions:
  - "Gérer le Stock" → `/pharmacy/stock`
  - "Réservations" → `/pharmacy/reservations`
  - "Paramètres" → `/pharmacy/settings`
- [ ] Recent low stock alerts (last 5 items)
- [ ] Pending reservations widget

**Server Actions Needed:**
- `getPharmacyStats(pharmacyId)` - returns all stats
- `getLowStockItems(pharmacyId, limit)` - returns items needing restock
- `getPendingReservations(pharmacyId, limit)` - returns unconfirmed reservations

### Feature 2.2: Stock Management Page (`app/pharmacy/stock/page.tsx`)

**Requirements:**
- [ ] Page title: "Gestion du Stock"
- [ ] Search/filter bar to find medicines
- [ ] Table showing all medicines in inventory:
  - Medicine name
  - Form & dosage
  - Current quantity
  - Min threshold
  - Status badge
  - Price
  - Expiry date
  - Actions (edit, delete)
- [ ] Inline editing or modal for updating:
  - Quantity (triggers auto status recalculation)
  - Price
  - Expiry date
  - Min threshold
- [ ] "Ajouter Médicament" button to add new stock entry
- [ ] Status auto-calculation on quantity change:
  - quantity <= 0 → OUT_OF_STOCK
  - quantity <= minThreshold → LOW_STOCK
  - quantity > minThreshold → AVAILABLE
- [ ] Trigger notifications if stock goes from 0 to > 0

**Server Actions Needed:**
- `getPharmacyStock(pharmacyId)` - returns all stock items
- `updateStockQuantity(stockId, quantity)` - updates qty + recalcs status
- `updateStockDetails(stockId, data)` - updates price, expiry, threshold
- `addStockItem(pharmacyId, medicineId, data)` - adds new inventory item
- `deleteStockItem(stockId)` - removes from inventory

**Critical Logic - Auto Status Calculation:**
```typescript
function calculateStockStatus(quantity: number, minThreshold: number) {
  if (quantity <= 0) return 'OUT_OF_STOCK'
  if (quantity <= minThreshold) return 'LOW_STOCK'
  return 'AVAILABLE'
}
```

**Critical Logic - Notification Trigger:**
```typescript
// When updating stock quantity
export async function updateStockQuantity(stockId: number, newQuantity: number) {
  // Get old quantity
  const stock = await db.query.pharmacyStock.findFirst({
    where: eq(pharmacyStock.id, stockId)
  })
  
  const oldQuantity = stock.quantity
  const newStatus = calculateStockStatus(newQuantity, stock.minThreshold)
  
  // Update stock
  await db.update(pharmacyStock)
    .set({ 
      quantity: newQuantity, 
      status: newStatus,
      updatedAt: new Date()
    })
    .where(eq(pharmacyStock.id, stockId))
  
  // If stock went from 0 to available, notify waitlist
  if (oldQuantity === 0 && newQuantity > 0) {
    await notifyWaitlist(stock.pharmacyId, stock.medicineId)
  }
  
  revalidatePath('/pharmacy/stock')
  revalidatePath('/search')
  
  return { success: true }
}
```

### Feature 2.3: Reservation Management (`app/pharmacy/reservations/page.tsx`)

**Requirements:**
- [ ] Page title: "Réservations"
- [ ] Tabs to filter:
  - En Attente (PENDING)
  - Confirmées (CONFIRMED)
  - Collectées (COLLECTED)
  - Annulées (CANCELLED)
- [ ] Table showing reservations:
  - Medicine name
  - Citizen name
  - Citizen phone
  - Date created
  - Status
  - Actions
- [ ] Actions per reservation:
  - "Confirmer" (PENDING → CONFIRMED)
  - "Marquer Collecté" (CONFIRMED → COLLECTED)
  - "Annuler" (any → CANCELLED)
- [ ] Click phone number to call or WhatsApp
- [ ] Filter/search by citizen name or medicine

**Server Actions Needed:**
- `getReservations(pharmacyId, statusFilter?)` - returns reservations
- `updateReservationStatus(reservationId, status)` - changes status
- `deleteReservation(reservationId)` - removes reservation

### Feature 2.4: Pharmacy Settings (`app/pharmacy/settings/page.tsx`)

**Requirements:**
- [ ] Page title: "Paramètres de la Pharmacie"
- [ ] Pharmacy info card (read-only):
  - Nom
  - Adresse
  - Téléphone
  - WhatsApp
  - Horaires
- [ ] Duty status toggle:
  - "Pharmacie de Garde" checkbox
  - When enabled, pharmacy shows with gold marker on map
  - Save button to update
- [ ] Pharmacist profile section:
  - Name
  - Email
  - Password change (optional)

**Server Actions Needed:**
- `updatePharmacyGardeStatus(pharmacyId, isGarde)` - toggles duty status
- `updatePharmacyInfo(pharmacyId, data)` - updates pharmacy details

---

## Implementation Requirements

### Code Standards

1. **TypeScript**: Fully typed, no `any` types
2. **Server Components by default**: Only use `'use client'` for maps, forms, search
3. **Server Actions**: Use `'use server'` directive for all mutations
4. **Auth Check**: Verify session for pharmacist routes
5. **French UI**: All text in French
6. **Import Paths**: Use `@/` alias

### Map Integration Requirements

**Install Dependencies:**
```bash
npm install leaflet react-leaflet leaflet-routing-machine
npm install -D @types/leaflet @types/leaflet-routing-machine
```

**Leaflet CSS Import (app/layout.tsx):**
```typescript
import 'leaflet/dist/leaflet.css'
```

**Fix Leaflet Default Icons:**
```typescript
// lib/leaflet-config.ts
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})
```

### Search Performance

**Debounced Search:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'

export function MedicineSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  
  const debouncedSearch = useDebouncedCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) return
      const medicines = await searchMedicines(searchQuery)
      setResults(medicines)
    },
    300 // 300ms debounce
  )
  
  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])
  
  return (
    <Input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Rechercher un médicament..."
    />
  )
}
```

---

## Server Actions to Implement

### Medicine Search Actions (`lib/actions/medicine-search-actions.ts`)

```typescript
'use server'

import { db } from '@/lib/db'
import { medicines, pharmacyStock, pharmacies } from '@/lib/db/schema'
import { eq, or, like, gt, and, sql } from 'drizzle-orm'

// 1. Search medicines (autocomplete)
export async function searchMedicines(query: string) {
  // If query < 2 chars, return []
  // Query medicines WHERE name LIKE %query% OR activeIngredient LIKE %query%
  // Limit to 10 results
  // Return medicines array
}

// 2. Find pharmacies with stock for a medicine
export async function findPharmaciesWithStock(medicineId: number) {
  // Query pharmacyStock WHERE medicineId=X AND quantity > 0
  // Include pharmacy details (name, address, phone, lat, lng, isGarde, hours)
  // Include medicine details
  // Calculate distance from user location if available
  // Sort by: isGarde DESC, quantity DESC
  // Return array of pharmacies with stock info
}

// 3. Create reservation (citizen)
export async function createReservation(data: {
  pharmacyId: number
  medicineId: number
  citizenName: string
  citizenPhone: string
  userId?: number
}) {
  // Create reservation with status PENDING
  // Revalidate paths
  // Return { success: true }
}

// 4. Create notification request (waitlist)
export async function createNotificationRequest(data: {
  pharmacyId: number
  medicineId: number
  email?: string
  phoneNumber?: string
}) {
  // At least one contact method required
  // Create notification request with status PENDING
  // Return { success: true }
}
```

### Pharmacy Stock Actions (`lib/actions/pharmacy-stock-actions.ts`)

```typescript
'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { users, pharmacyStock, notificationRequests } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// 1. Get pharmacy statistics
export async function getPharmacyStats() {
  // Get session and verify pharmacist role
  // Get user's pharmacyId
  // Count total stock items
  // Count low stock items (quantity <= minThreshold)
  // Count out of stock items
  // Count pending reservations
  // Return stats object
}

// 2. Get pharmacy stock
export async function getPharmacyStock() {
  // Get session and verify pharmacist
  // Query pharmacyStock WHERE pharmacyId=X
  // Include medicine details
  // Order by status, then name
  // Return stock items array
}

// 3. Update stock quantity
export async function updateStockQuantity(stockId: number, newQuantity: number) {
  // Get session and verify pharmacist
  // Get stock item and verify it belongs to pharmacist's pharmacy
  // Calculate new status based on quantity and minThreshold
  // Update stock with new quantity and status
  // If went from 0 to > 0, trigger notifications
  // Revalidate paths
  // Return { success: true }
}

// 4. Notify waitlist (internal function)
async function notifyWaitlist(pharmacyId: number, medicineId: number) {
  // Find all PENDING notification requests for this medicine at this pharmacy
  // For each request:
  //   - Send email/SMS notification (log for now)
  //   - Update status to SENT
  // Return count of notifications sent
}

// 5. Update stock details
export async function updateStockDetails(
  stockId: number,
  data: {
    price?: number
    expiryDate?: Date
    minThreshold?: number
  }
) {
  // Get session and verify pharmacist
  // Verify stock belongs to pharmacist's pharmacy
  // Update stock details
  // If minThreshold changed, recalculate status
  // Revalidate paths
  // Return { success: true }
}

// 6. Add stock item
export async function addStockItem(data: {
  medicineId: number
  quantity: number
  price?: number
  expiryDate?: Date
  minThreshold: number
}) {
  // Get session and verify pharmacist
  // Calculate initial status
  // Create stock item
  // Revalidate paths
  // Return { success: true }
}
```

### Reservation Actions (`lib/actions/reservation-actions.ts`)

```typescript
'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { reservations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// 1. Get reservations
export async function getReservations(statusFilter?: string) {
  // Get session and verify pharmacist
  // Get user's pharmacyId
  // Query reservations WHERE pharmacyId=X
  // If statusFilter provided, add: AND status=statusFilter
  // Include medicine details
  // Order by createdAt DESC
  // Return reservations array
}

// 2. Update reservation status
export async function updateReservationStatus(
  reservationId: number,
  status: 'PENDING' | 'CONFIRMED' | 'COLLECTED' | 'CANCELLED'
) {
  // Get session and verify pharmacist
  // Get reservation and verify it belongs to pharmacist's pharmacy
  // Update status
  // Revalidate paths
  // Return { success: true }
}

// 3. Delete reservation
export async function deleteReservation(reservationId: number) {
  // Get session and verify pharmacist
  // Verify reservation belongs to pharmacist's pharmacy
  // Delete reservation
  // Revalidate paths
  // Return { success: true }
}
```

---

## UI Design System

### Color Palette (Midnight Theme)

```css
/* Dark base */
--background: 222.2 84% 4.9%
--foreground: 210 40% 98%

/* Accent colors */
--primary: 186 100% 42%        /* Cyan for main actions */
--primary-foreground: 0 0% 100%

--accent: 217.2 91.2% 59.8%    /* Blue for regular pharmacies */
--accent-foreground: 222.2 47.4% 11.2%

--warning: 38 92% 50%          /* Amber/Gold for garde pharmacies */
--warning-foreground: 48 96% 89%

--success: 142 71% 45%         /* Green for available */
--destructive: 0 84% 60%       /* Red for out of stock */
```

### Glassmorphism Components

```tsx
// Card with glass effect
<Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// Badge with glow
<Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
  Disponible
</Badge>
```

---

## Testing Checklist

### Public Search:
- [ ] Navigate to `/search` (no auth required)
- [ ] Search for medicine (e.g., "Doliprane")
- [ ] See autocomplete results
- [ ] Select medicine
- [ ] See map with pharmacy markers
- [ ] Click marker to see popup
- [ ] Gold markers for garde pharmacies
- [ ] Click pharmacy card to see details
- [ ] "Réserver" button opens reservation form
- [ ] Submit reservation successfully
- [ ] "Me Notifier" button for out-of-stock items

### Pharmacist Dashboard:
- [ ] Login as `ahmed@locatomed.ma` / `demo123`
- [ ] See dashboard with correct stats
- [ ] Navigate to stock management
- [ ] See all medicines in inventory
- [ ] Update quantity inline
- [ ] Status recalculates automatically
- [ ] Low stock items show orange badge
- [ ] Navigate to reservations
- [ ] See pending reservations
- [ ] Confirm reservation
- [ ] Mark as collected
- [ ] Navigate to settings
- [ ] Toggle garde status
- [ ] Pharmacy shows gold marker on map

---

## Priority Order

1. **Database setup** - Ensure all tables exist and seed data is loaded
2. **Medicine search actions** - Backend logic for search and availability
3. **Public search page** - Basic UI without map
4. **Pharmacy map component** - Leaflet integration
5. **Pharmacy cards** - Display stock availability
6. **Reservation system** - Citizen reservation flow
7. **Pharmacist dashboard** - Stats and overview
8. **Stock management** - Pharmacist inventory control
9. **Reservation management** - Pharmacist reservation handling
10. **Route visualization** - Advanced map feature
11. **Notification system** - Waitlist alerts

---

## Success Criteria

✅ Citizens can:
- Search for medicines by name
- See which pharmacies have stock
- View pharmacies on interactive map
- See duty pharmacies (garde) highlighted
- Reserve medicines at pharmacies
- Request notifications for out-of-stock items
- Get directions to pharmacy

✅ Pharmacists can:
- View stock dashboard with statistics
- Manage inventory (update quantities, prices)
- See low stock alerts
- Accept/reject reservations
- Toggle duty pharmacy status
- Update pharmacy information

✅ Code quality:
- No TypeScript errors
- All maps render correctly
- Proper auth checks
- Status auto-calculation works
- Notifications trigger correctly
- Clean, responsive UI

---

## Additional Notes

- Seed data already includes 158 pharmacies in Tangier with coordinates
- 49 medicines are pre-seeded
- Full pharmacy stock matrix exists (7,742 stock rows)
- Doliprane is guaranteed available in at least one Centre-ville pharmacy
- Use Tangier coordinates for map center: [35.7595, -5.8340]
- Map zoom level 13 works well for city-wide view
- Keep reservation flow simple - just name and phone
- Notification system can log to console for now (email/SMS later)

Good luck! 🚀
