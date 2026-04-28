# Claude Code Prompt - Patient Portal

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
- Database schema with: users, hospitals, doctors, appointments, medical_records, prescriptions, medicines, pharmacies, pharmacyStock
- Rich seed data including Tangier hospitals, pharmacies, medicines, and patient medical history
- Route protection and role-based redirects
- shadcn/ui components already installed
- Patient can log in at `/patient/login`
- Auth secret resolution and login redirect fixes implemented

❌ **Not Yet Built (Your Tasks):**
- Patient dashboard with live data
- Hospital/pharmacy discovery with interactive map
- Appointment booking system
- Medical folder (consultation history)
- Favorites management
- Medicine search with pharmacy availability
- Ordonnance (prescription) scanning with AI
- Patient assistant chatbot

## Your Mission

Implement the **Patient Portal** - a comprehensive healthcare platform for citizens that allows them to:
- View their medical dashboard and health summary
- Discover hospitals and pharmacies in Tangier
- Book appointments with doctors
- Manage favorite hospitals
- View their complete medical history
- Search for medicines and find pharmacies with stock
- Scan prescriptions and find pharmacies with all medicines
- Get AI-powered health assistance

---

## Files to Create

```
app/patient/
├── dashboard/
│   └── page.tsx                           # CREATE - Patient dashboard with live data
├── discover/
│   └── page.tsx                           # CREATE - Hospital/pharmacy discovery
├── booking/
│   ├── page.tsx                           # CREATE - Appointment booking form
│   └── actions.ts                         # CREATE - Booking server actions
├── reservations/
│   └── page.tsx                           # CREATE - Appointment history
├── favorites/
│   ├── page.tsx                           # CREATE - Favorite hospitals management
│   └── actions.ts                         # CREATE - Favorites server actions
├── folder/
│   └── page.tsx                           # CREATE - Medical folder (records)
├── medicine-search/
│   ├── page.tsx                           # CREATE - Medicine search with map
│   └── actions.ts                         # CREATE - Medicine search actions
├── ordonnance-scan/
│   ├── page.tsx                           # CREATE - Prescription scanner
│   └── actions.ts                         # CREATE - Ordonnance scan actions
└── chatbot/
    ├── page.tsx                           # CREATE - AI assistant
    └── actions.ts                         # CREATE - Chatbot actions

features/patient/
├── components/
│   ├── dashboard/
│   │   ├── quick-actions.tsx              # CREATE - Dashboard quick links
│   │   ├── upcoming-reservation-card.tsx   # CREATE - Next appointment card
│   │   ├── summary-cards.tsx              # CREATE - Stats cards
│   │   └── favorites-preview.tsx          # CREATE - Favorites widget
│   ├── discover/
│   │   ├── filter-bar.tsx                 # CREATE - Hospital/pharmacy filters
│   │   ├── list.tsx                       # CREATE - Results list
│   │   ├── discover-map-leaflet.tsx       # CREATE - Interactive map
│   │   └── discover-client.tsx            # CREATE - Client wrapper
│   ├── booking/
│   │   ├── booking-form.tsx               # CREATE - Appointment booking form
│   │   ├── reservation-list.tsx           # CREATE - Appointments list
│   │   └── cancel-reservation-button.tsx  # CREATE - Cancel button
│   ├── favorites/
│   │   ├── favorite-toggle-form.tsx       # CREATE - Add/remove favorite
│   │   ├── favorite-hospital-picker.tsx   # CREATE - Hospital selector
│   │   └── favorites-list.tsx             # CREATE - Saved hospitals
│   ├── medical-folder/
│   │   ├── medical-folder-filters.tsx     # CREATE - Filter controls
│   │   └── medical-folder-timeline.tsx    # CREATE - Records timeline
│   ├── medicine-search/
│   │   ├── medicine-search-client.tsx     # CREATE - Search interface
│   │   └── pharmacy-map.tsx               # CREATE - Pharmacy locations map
│   ├── ordonnance-scan/
│   │   └── ordonnance-scan-client.tsx     # CREATE - Upload & scan UI
│   └── chatbot/
│       └── chatbot-client.tsx             # CREATE - Chat interface
├── services/
│   ├── dashboard.ts                       # CREATE - Dashboard data
│   ├── discover/index.ts                  # CREATE - Discovery data
│   ├── booking/index.ts                   # CREATE - Booking data
│   ├── favorites.ts                       # CREATE - Favorites data
│   ├── medical-folder.ts                  # CREATE - Medical records data
│   ├── medicine-search.ts                 # CREATE - Medicine search data
│   ├── ordonnance-scan.ts                 # CREATE - Prescription scanning
│   └── chatbot.ts                         # CREATE - Chatbot logic
├── schemas/
│   ├── dashboard.ts                       # CREATE - Zod schemas
│   ├── discover/index.ts                  # CREATE - Zod schemas
│   ├── booking/index.ts                   # CREATE - Zod schemas
│   ├── favorites.ts                       # CREATE - Zod schemas
│   ├── medicine-search.ts                 # CREATE - Zod schemas
│   ├── ordonnance-scan.ts                 # CREATE - Zod schemas
│   └── chatbot.ts                         # CREATE - Zod schemas
├── types/
│   ├── dashboard.ts                       # CREATE - TypeScript types
│   ├── discover/index.ts                  # CREATE - TypeScript types
│   ├── booking/index.ts                   # CREATE - TypeScript types
│   ├── favorites.ts                       # CREATE - TypeScript types
│   ├── medical-folder.ts                  # CREATE - TypeScript types
│   ├── medicine-search.ts                 # CREATE - TypeScript types
│   ├── ordonnance-scan.ts                 # CREATE - TypeScript types
│   └── chatbot.ts                         # CREATE - TypeScript types
└── constants/
    └── tangier.ts                         # CREATE - Tangier coordinates

lib/db/
└── schema.ts                              # MODIFY - Add patient_favorite_hospitals table
```

---

## Database Schema Extensions

### New Table: Patient Favorite Hospitals

```typescript
// Add to lib/db/schema.ts

export const patientFavoriteHospitals = sqliteTable(
  'patient_favorite_hospitals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    patientId: integer('patient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    hospitalId: integer('hospital_id')
      .notNull()
      .references(() => hospitals.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    // Unique constraint: one patient can favorite a hospital only once
    uniquePatientHospital: unique().on(table.patientId, table.hospitalId),
  })
)

// Add relations
export const patientFavoriteHospitalsRelations = relations(
  patientFavoriteHospitals,
  ({ one }) => ({
    patient: one(users, {
      fields: [patientFavoriteHospitals.patientId],
      references: [users.id],
    }),
    hospital: one(hospitals, {
      fields: [patientFavoriteHospitals.hospitalId],
      references: [hospitals.id],
    }),
  })
)
```

---

## Feature Implementation Guide

### Phase 1: Dashboard & Core Infrastructure

#### 1.1 Patient Dashboard (`app/patient/dashboard/page.tsx`)

**Requirements:**
- [ ] Auth required (patient role only)
- [ ] Server component with live data
- [ ] Page title: "Mon Tableau de Bord"
- [ ] Quick actions section with links to:
  - Réserver un Rendez-vous → `/patient/booking`
  - Mes Favoris → `/patient/favorites`
  - Mon Dossier Médical → `/patient/folder`
  - Chercher un Médicament → `/patient/medicine-search`
  - Scanner une Ordonnance → `/patient/ordonnance-scan`
  - Découvrir → `/patient/discover`
  - Assistant → `/patient/chatbot`
- [ ] Upcoming reservation card showing:
  - Next appointment details
  - Hospital name
  - Doctor name and specialty
  - Date and time
  - "Voir Détails" button
- [ ] Summary cards showing:
  - Total Réservations
  - Rendez-vous à Venir
  - Rendez-vous Terminés
  - Hôpitaux Favoris
- [ ] Favorites preview section (last 3 favorite hospitals)

**Server Actions Needed:**
```typescript
// features/patient/services/dashboard.ts
export async function getPatientDashboardData(patientId: number) {
  // Get upcoming reservation with hospital/doctor details
  // Count total reservations by status
  // Count favorite hospitals
  // Get preview of favorite hospitals
  // Return dashboard data
}
```

**Components:**
```typescript
// features/patient/components/dashboard/quick-actions.tsx
// Grid of action cards with icons and links

// features/patient/components/dashboard/upcoming-reservation-card.tsx
// Card showing next appointment with hospital/doctor info

// features/patient/components/dashboard/summary-cards.tsx
// Stat cards for reservations and favorites counts

// features/patient/components/dashboard/favorites-preview.tsx
// Preview of favorite hospitals with "Voir Tous" link
```

---

#### 1.2 Hospital/Pharmacy Discovery (`app/patient/discover/page.tsx`)

**Requirements:**
- [ ] Auth required (patient role)
- [ ] Server component with URL-based filtering
- [ ] View toggle: Hôpitaux / Pharmacies
- [ ] Filter bar for hospitals:
  - Specialty dropdown (all, cardiology, pediatrics, general, etc.)
  - Type dropdown (all, public, private)
- [ ] Results list showing:
  - Hospital/pharmacy name
  - Address
  - City (Tanger)
  - Phone
  - Opening hours (if pharmacy)
  - "De Garde" badge (if pharmacy on duty)
- [ ] Interactive Leaflet map:
  - Blue markers for hospitals
  - Green markers for garde pharmacies
  - Gray markers for regular pharmacies
  - Click marker → highlight list item
  - Click list item → center map on location
- [ ] Selection strip showing selected hospital/pharmacy details

**Server Actions:**
```typescript
// features/patient/services/discover/index.ts
export async function getDiscoverData(params: {
  view: 'hospitals' | 'pharmacies'
  specialty?: string
  type?: string
}) {
  // If hospitals: query with specialty/type filters
  // If pharmacies: query all with isGarde status
  // Return with coordinates for map
}
```

**Components:**
```typescript
// features/patient/components/discover/filter-bar.tsx
// Filters for specialty and type (hospitals only)

// features/patient/components/discover/list.tsx
// Results cards with click handler for map sync

// features/patient/components/discover/discover-map-leaflet.tsx
// Interactive Leaflet map with markers and popups

// features/patient/components/discover/discover-client.tsx
// Client wrapper coordinating map/list selection sync
```

**Map Setup:**
```typescript
// features/patient/constants/tangier.ts
export const TANGIER_CENTER: [number, number] = [35.7595, -5.8340]
export const DEFAULT_ZOOM = 13
```

---

### Phase 2: Appointment Booking & Management

#### 2.1 Appointment Booking (`app/patient/booking/page.tsx`)

**Requirements:**
- [ ] Auth required (patient role)
- [ ] Page title: "Réserver un Rendez-vous"
- [ ] Multi-step form:
  - Step 1: Select hospital (dropdown)
  - Step 2: Select specialty (dropdown, filtered by hospital)
  - Step 3: Select doctor (dropdown, filtered by hospital + specialty)
  - Step 4: Select date and time
- [ ] Validation:
  - All fields required
  - Date must be in future
  - No conflicting appointments (same patient, same datetime)
- [ ] Submit creates appointment with status 'scheduled'
- [ ] Success: toast + redirect to `/patient/reservations`
- [ ] Error: toast with message

**Server Actions:**
```typescript
// app/patient/booking/actions.ts
'use server'

export async function createReservation(data: {
  hospitalId: number
  doctorId: number
  specialty: string
  scheduledAt: Date
}) {
  // Auth check: requireRole('patient')
  // Validate inputs with Zod
  // Check for conflicts (same patient, same datetime)
  // Create appointment record
  // Revalidate paths
  // Return { success: true } or error
}
```

**Components:**
```typescript
// features/patient/components/booking/booking-form.tsx
'use client'

// Form with dynamic dropdowns
// Hospital selection loads specialties
// Specialty selection loads doctors
// Date/time picker
// Submit handler calling server action
```

---

#### 2.2 Reservation Management (`app/patient/reservations/page.tsx`)

**Requirements:**
- [ ] Auth required (patient role)
- [ ] Page title: "Mes Rendez-vous"
- [ ] Three sections:
  - À Venir (scheduled, future dates)
  - Terminés (completed)
  - Annulés (cancelled)
- [ ] Each reservation card shows:
  - Hospital name
  - Doctor name and specialty
  - Date and time (formatted in French)
  - Status badge
  - "Annuler" button (upcoming only)
- [ ] Cancel button:
  - Confirmation modal
  - Updates status to 'cancelled'
  - Toast feedback
  - Revalidates page

**Server Actions:**
```typescript
// app/patient/booking/actions.ts
export async function cancelReservation(appointmentId: number) {
  // Auth check: requireRole('patient')
  // Verify appointment belongs to patient
  // Verify appointment is upcoming (not past, not already cancelled)
  // Update status to 'cancelled'
  // Revalidate paths
  // Return { success: true }
}
```

**Components:**
```typescript
// features/patient/components/booking/reservation-list.tsx
// Group appointments by status
// Show cards with appointment details

// features/patient/components/booking/cancel-reservation-button.tsx
'use client'
// Button with confirmation dialog
// Calls cancel action
// Shows toast feedback
```

---

### Phase 3: Favorites & Medical Folder

#### 3.1 Favorites Management (`app/patient/favorites/page.tsx`)

**Requirements:**
- [ ] Auth required (patient role)
- [ ] Page title: "Mes Hôpitaux Favoris"
- [ ] Hospital picker section:
  - Search/select hospital from dropdown
  - "Ajouter aux Favoris" button
  - Success toast on add
  - Error if already favorited
- [ ] Favorites list section:
  - Cards showing hospital name, address, phone
  - "Retirer" button per hospital
  - Confirmation before removal
  - Empty state: "Aucun hôpital favori"

**Server Actions:**
```typescript
// app/patient/favorites/actions.ts
'use server'

export async function addFavoriteHospital(hospitalId: number) {
  // Auth check: requireRole('patient')
  // Check if already favorited (unique constraint)
  // Insert into patient_favorite_hospitals
  // Revalidate paths
  // Return { success: true }
}

export async function removeFavoriteHospital(hospitalId: number) {
  // Auth check: requireRole('patient')
  // Delete from patient_favorite_hospitals
  // Revalidate paths
  // Return { success: true }
}
```

**Components:**
```typescript
// features/patient/components/favorites/favorite-hospital-picker.tsx
'use client'
// Dropdown to search hospitals
// Add button calling server action

// features/patient/components/favorites/favorites-list.tsx
// List of favorited hospitals
// Remove button per item

// features/patient/components/favorites/favorite-toggle-form.tsx
// Reusable add/remove toggle (used in discover cards later)
```

---

#### 3.2 Medical Folder (`app/patient/folder/page.tsx`)

**Requirements:**
- [ ] Auth required (patient role)
- [ ] Page title: "Mon Dossier Médical"
- [ ] Filter bar:
  - Doctor dropdown (filter by doctor)
  - Date from (filter by date range start)
  - Date to (filter by date range end)
  - "Réinitialiser" button to clear filters
- [ ] Timeline view:
  - Group by month/year (sticky headers)
  - Show all medical records
  - Each record card shows:
    - Date (formatted in French)
    - Hospital name
    - Doctor name and specialty
    - Diagnosis
    - Consultation notes
    - Prescriptions list (medicine, dosage, duration)
- [ ] Empty state: "Aucun dossier médical"
- [ ] Link back to booking if empty

**Server Actions:**
```typescript
// features/patient/services/medical-folder.ts
export async function getPatientMedicalRecords(params: {
  patientId: number
  doctorId?: number
  fromDate?: Date
  toDate?: Date
}) {
  // Query medical_records WHERE patientId = X
  // Apply filters (doctorId, date range)
  // Join doctor, hospital, appointment data
  // Join prescriptions with medicine details
  // Order by createdAt DESC
  // Return records array
}
```

**Components:**
```typescript
// features/patient/components/medical-folder/medical-folder-filters.tsx
// Filter controls with URL params

// features/patient/components/medical-folder/medical-folder-timeline.tsx
// Timeline view with grouped records
// Record cards with diagnosis, notes, prescriptions
```

---

### Phase 4: Medicine Search & Pharmacy Finder

#### 4.1 Medicine Search (`app/patient/medicine-search/page.tsx`)

**Requirements:**
- [ ] Auth required (patient role)
- [ ] Page title: "Chercher un Médicament"
- [ ] Search bar:
  - Debounced input (300ms)
  - Minimum 2 characters
  - Searches medicine name or active ingredient
- [ ] Quick search suggestions:
  - Common medicines as clickable chips
  - Example: "Paracétamol", "Doliprane", "Augmentin"
- [ ] Results section:
  - Medicine info card (name, form, dosage, DCI, PPM price)
  - Pharmacy availability list
  - Interactive map with pharmacy markers
- [ ] Each pharmacy row shows:
  - Pharmacy name
  - Address and neighborhood
  - Stock status badge (in stock, low stock, out of stock)
  - Quantity available
  - Price
  - Distance from user (km)
  - "De Garde" badge if applicable
- [ ] Map integration:
  - Click pharmacy row → center map and highlight marker
  - Click map marker → highlight corresponding pharmacy row
- [ ] Geolocation:
  - Request user location for distance calculation
  - Fallback to Tangier center if denied

**Server Actions:**
```typescript
// app/patient/medicine-search/actions.ts
'use server'

export async function searchMedicinesAction(query: string) {
  // Auth check: requireRole('patient')
  // Validate query (min 2 chars)
  // Search medicines table (name LIKE %query% OR activeIngredient LIKE %query%)
  // For each medicine:
  //   - Join pharmacy_stock WHERE quantity > 0
  //   - Join pharmacies for details (name, address, lat, lng, isGarde)
  //   - Calculate distance from Tangier center
  //   - Include stock status, quantity, price
  // Return grouped results (medicine → pharmacies array)
}
```

**Components:**
```typescript
// features/patient/components/medicine-search/medicine-search-client.tsx
'use client'
// Search input with debounce
// Quick suggestions chips
// Medicine results cards
// Pharmacy availability list with map sync

// features/patient/components/medicine-search/pharmacy-map.tsx
'use client'
// Leaflet map with pharmacy markers
// Popup with pharmacy details
// Selection sync with list
```

**Distance Calculation:**
```typescript
// Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
```

---

### Phase 5: Ordonnance Scanning

#### 5.1 Prescription Scanner (`app/patient/ordonnance-scan/page.tsx`)

**Requirements:**
- [ ] Auth required (patient role)
- [ ] Page title: "Scanner une Ordonnance"
- [ ] Upload section:
  - File input (PDF, PNG, JPG, WEBP)
  - Max size: 5MB
  - File preview after selection
  - "Scanner l'Ordonnance" button
- [ ] Validation:
  - File required
  - Valid MIME type
  - Size <= 5MB
- [ ] Loading state during scan
- [ ] Results section:
  - Detected medicines list
  - Each medicine shows:
    - Medicine name
    - Matched from database (if found)
    - Active ingredient
    - Form and dosage
    - Confidence score
    - PPM price
  - Pharmacy availability per medicine:
    - Pharmacy name, address, neighborhood
    - Stock status badge
    - Quantity
    - Price
    - Distance from user
    - "De Garde" badge
- [ ] Availability sorting:
  - Stock status (in stock > low stock > out of stock)
  - De garde pharmacies first (when stock equal)
  - Nearest distance
- [ ] Unmatched medicines list (if extraction found names not in DB)

**Server Actions:**
```typescript
// app/patient/ordonnance-scan/actions.ts
'use server'

export async function scanOrdonnanceAction(formData: FormData) {
  // Auth check: requireRole('patient')
  // Extract file from formData
  // Validate file (size, type)
  
  // AI PLACEHOLDER (to be replaced with real OCR/AI)
  // For now: deterministic extraction based on filename/metadata
  // Example: if filename contains "paracetamol" → extract "Paracetamol"
  
  // For each detected medicine name:
  //   - Search medicines table for matches
  //   - If found: get full medicine details
  //   - Query pharmacy_stock for availability
  //   - Join pharmacies for location/details
  //   - Calculate distance
  //   - Sort by stock status, garde, distance
  
  // Return structured result:
  //   - matched medicines with pharmacy availability
  //   - unmatched medicine names
  //   - confidence scores
}
```

**Placeholder Extraction Logic:**
```typescript
// features/patient/services/ordonnance-scan.ts
export async function extractMedicinesFromFile(file: File) {
  // PLACEHOLDER: This will be replaced by real OCR/AI
  
  // Current logic: extract medicine candidates from filename
  const filename = file.name.toLowerCase()
  const candidates: string[] = []
  
  // Detect common medicine names in filename
  if (filename.includes('paracetamol')) candidates.push('Paracétamol')
  if (filename.includes('doliprane')) candidates.push('Doliprane')
  if (filename.includes('augmentin')) candidates.push('Augmentin')
  
  // Return structured extraction result
  return {
    detectedMedicines: candidates,
    confidence: 0.85, // Placeholder score
  }
}
```

**Components:**
```typescript
// features/patient/components/ordonnance-scan/ordonnance-scan-client.tsx
'use client'
// File upload input
// Preview section
// Scan button with loading state
// Results display:
//   - Matched medicines cards
//   - Pharmacy availability per medicine
//   - Unmatched list
```

---

### Phase 6: Patient Assistant Chatbot

#### 6.1 AI Assistant (`app/patient/chatbot/page.tsx`)

**Requirements:**
- [ ] Auth required (patient role)
- [ ] Page title: "Assistant LOCATOMED"
- [ ] Chat interface:
  - Message history (user + assistant)
  - Input field with send button
  - Loading state while processing
  - Suggested quick actions as chips
- [ ] Intent detection:
  - Booking-related: "Je veux réserver", "rendez-vous cardio"
  - Pharmacy-related: "Où trouver doliprane", "pharmacie de garde"
  - Discover-related: "hôpitaux", "trouver un médecin"
  - General: everything else
- [ ] Response types:
  - Text answer
  - Suggestion chips with links:
    - Réserver un Rendez-vous → `/patient/booking`
    - Chercher un Médicament → `/patient/medicine-search`
    - Découvrir Hôpitaux → `/patient/discover?view=hospitals`
    - Scanner Ordonnance → `/patient/ordonnance-scan`
- [ ] Context-aware suggestions:
  - If booking intent: suggest nearby hospitals
  - If pharmacy intent: suggest medicines to search
  - If discover intent: suggest specialties

**Server Actions:**
```typescript
// app/patient/chatbot/actions.ts
'use server'

export async function askPatientChatbotAction(question: string) {
  // Auth check: requireRole('patient')
  // Validate question (non-empty, max length)
  
  // RULE-BASED CHATBOT (no LLM integration yet)
  
  // Detect intent:
  const intent = detectIntent(question)
  
  // Generate response based on intent:
  switch (intent) {
    case 'booking':
      return {
        message: 'Je peux vous aider à réserver un rendez-vous...',
        suggestions: [
          { text: 'Réserver', link: '/patient/booking' },
          { text: 'Voir mes rendez-vous', link: '/patient/reservations' }
        ],
        hospitals: await getTopHospitalsBySpecialty('cardiology')
      }
    
    case 'pharmacy':
      return {
        message: 'Vous cherchez un médicament ou une pharmacie ?',
        suggestions: [
          { text: 'Chercher un médicament', link: '/patient/medicine-search' },
          { text: 'Pharmacies de garde', link: '/patient/discover?view=pharmacies' }
        ],
        pharmacies: await getGardePharmacies()
      }
    
    case 'discover':
      return {
        message: 'Explorez les hôpitaux et pharmacies à Tanger...',
        suggestions: [
          { text: 'Voir les hôpitaux', link: '/patient/discover?view=hospitals' },
          { text: 'Voir les pharmacies', link: '/patient/discover?view=pharmacies' }
        ]
      }
    
    default:
      return {
        message: 'Comment puis-je vous aider aujourd\'hui ?',
        suggestions: [
          { text: 'Réserver', link: '/patient/booking' },
          { text: 'Mon dossier', link: '/patient/folder' }
        ]
      }
  }
}

function detectIntent(question: string): string {
  const q = question.toLowerCase()
  
  // Booking keywords
  if (
    q.includes('réserver') ||
    q.includes('rendez-vous') ||
    q.includes('rdv') ||
    q.includes('consultation')
  ) return 'booking'
  
  // Pharmacy keywords
  if (
    q.includes('pharmacie') ||
    q.includes('médicament') ||
    q.includes('garde') ||
    q.includes('doliprane') ||
    q.includes('paracétamol')
  ) return 'pharmacy'
  
  // Discover keywords
  if (
    q.includes('hôpital') ||
    q.includes('médecin') ||
    q.includes('docteur') ||
    q.includes('spécialiste')
  ) return 'discover'
  
  return 'general'
}
```

**Components:**
```typescript
// features/patient/components/chatbot/chatbot-client.tsx
'use client'
// Chat interface with message history
// Input field with send button
// Loading spinner
// Suggestion chips with navigation
// Hospital/pharmacy cards from assistant response
```

---

## Implementation Requirements

### Code Standards

1. **TypeScript**: Fully typed, no `any` types
2. **Server Components by default**: Only use `'use client'` for forms, maps, chat
3. **Server Actions**: Use `'use server'` directive for all mutations
4. **Auth Check**: Use `requireRole('patient')` in all server actions
5. **French UI**: All text in French
6. **Import Paths**: Use `@/` alias
7. **Domain Isolation**: All patient code in `features/patient/` or `app/patient/`

### Auth Helper

```typescript
// lib/auth/helpers.ts (create if doesn't exist)
import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

export async function requireRole(role: string) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/patient/login')
  }
  
  if (session.user.role !== role) {
    throw new Error(`Forbidden: user is not a ${role}`)
  }
  
  return session.user
}
```

### Leaflet Setup

**Install Dependencies:**
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

**Add Leaflet CSS (app/globals.css):**
```css
@import 'leaflet/dist/leaflet.css';
```

**Fix Leaflet Icons (lib/leaflet-config.ts):**
```typescript
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})
```

---

## Database Migration

After creating the schema changes:

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Seed demo data
npm run db:seed
```

**Seed Script Updates (scripts/seed.ts):**

```typescript
// Add to seed script
import { patientFavoriteHospitals } from '@/lib/db/schema'

// Seed patient favorites for Fatima
const fatimaFavorites = [
  { patientId: fatimaId, hospitalId: 1 }, // Clinique du Détroit
  { patientId: fatimaId, hospitalId: 2 }, // Hôpital Mohamed V
]

await db.insert(patientFavoriteHospitals).values(fatimaFavorites)
```

---

## Testing Checklist

### Dashboard:
- [ ] Login as `fatima@locatomed.ma` / `demo123`
- [ ] Verify dashboard shows upcoming appointment
- [ ] Verify summary cards show correct counts
- [ ] Verify favorites preview displays
- [ ] Click all quick action links

### Discover:
- [ ] Toggle between hospitals and pharmacies
- [ ] Apply hospital filters (specialty, type)
- [ ] Click list item → map centers
- [ ] Click map marker → list highlights
- [ ] Verify garde pharmacies show green markers

### Booking:
- [ ] Select hospital → specialties load
- [ ] Select specialty → doctors load
- [ ] Select doctor → can choose date/time
- [ ] Submit → reservation created
- [ ] Verify redirect to reservations page

### Reservations:
- [ ] See upcoming appointments
- [ ] See completed appointments
- [ ] Click "Annuler" on upcoming → moves to cancelled
- [ ] Verify toast feedback

### Favorites:
- [ ] Add hospital to favorites
- [ ] Verify appears in list
- [ ] Remove hospital from favorites
- [ ] Verify dashboard preview updates

### Medical Folder:
- [ ] View timeline of consultations
- [ ] Apply doctor filter
- [ ] Apply date range filter
- [ ] Verify prescriptions display correctly
- [ ] Verify notes show with line breaks

### Medicine Search:
- [ ] Search "Doliprane" → results appear
- [ ] Verify pharmacy list shows stock status
- [ ] Verify distance calculation
- [ ] Click pharmacy → map centers
- [ ] Click map marker → pharmacy highlights
- [ ] Verify garde pharmacies highlighted

### Ordonnance Scan:
- [ ] Upload PDF file
- [ ] Verify file preview
- [ ] Click scan → loading state
- [ ] Verify detected medicines display
- [ ] Verify pharmacy availability per medicine
- [ ] Verify distance sorting works

### Chatbot:
- [ ] Ask booking question → get booking suggestions
- [ ] Ask pharmacy question → get pharmacy suggestions
- [ ] Click suggestion chip → navigates correctly
- [ ] Verify hospital/pharmacy cards display in response

---

## Priority Order

1. **Auth fixes** - Secret resolution and login redirect
2. **Dashboard** - Core patient home page
3. **Discover** - Hospital/pharmacy browsing
4. **Booking** - Appointment creation
5. **Reservations** - Appointment management
6. **Favorites** - Hospital favorites (requires migration)
7. **Medical Folder** - Consultation history
8. **Medicine Search** - Pharmacy finder
9. **Ordonnance Scan** - Prescription scanning
10. **Chatbot** - AI assistant

---

## Success Criteria

✅ Patients can:
- View personalized dashboard with health summary
- Discover hospitals and pharmacies in Tangier
- Book appointments with doctors
- Manage and cancel appointments
- Save favorite hospitals
- View complete medical history
- Search for medicines and find pharmacies with stock
- Scan prescriptions and find pharmacies with all medicines
- Get AI-powered assistance for healthcare tasks

✅ Code quality:
- No TypeScript errors
- All server actions have auth checks
- Maps render correctly
- Forms validate inputs
- Success/error feedback with toasts
- Responsive design (mobile-first)
- French language throughout
- Domain isolation (patient code separate)

---

## Known Limitations

### Current Implementation:
- **Ordonnance scanning** uses placeholder extraction (filename-based)
  - To be replaced with real OCR/AI (Tesseract, Google Vision, etc.)
- **Chatbot** is rule-based with keyword detection
  - To be replaced with LLM integration (OpenAI, Claude API)
- **Geolocation** requires browser permission
  - Falls back to Tangier center if denied
- **Distance calculation** uses Haversine formula
  - Assumes straight-line distance (not road distance)

### Future Enhancements:
- Real-time appointment availability checking
- Email/SMS notifications for appointments
- Payment integration for consultations
- Telemedicine video consultations
- Health metrics tracking
- Medicine interaction warnings
- Multi-language support (Arabic)

---

## Additional Notes

- Demo patient account: `fatima@locatomed.ma` / `demo123`
- All coordinates use Tangier as center: [35.7595, -5.8340]
- Seed data includes 3 completed consultations for Fatima
- Seed data includes 1 upcoming appointment
- Pharmacies in Tangier include garde status
- Medicine stock matrix is fully populated
- Use French date formatting: `toLocaleDateString('fr-FR')`
- Keep UI mobile-responsive (most patients use phones)

Good luck! 🚀
