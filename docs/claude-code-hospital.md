# Claude Code Prompt - Hospital Admin Portal

## Project Context

You're working on **LOCATOMED**, a multi-role healthcare platform for Morocco built with:
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **shadcn/ui** components
- **Drizzle ORM** with SQLite
- **Auth.js** (NextAuth v5)

## Current State

✅ **Already Working:**
- Complete authentication system with role-based login
- Database schema with: users, hospitals, appointments, medical_records
- Rich seed data (5 hospitals, demo users)
- Route protection and role-based redirects
- shadcn/ui components already installed
- Hospital admin can log in at `/hospital-admin/login`
- Basic doctor creation form exists at `/hospital-admin/doctors/new`

❌ **Not Yet Built (Your Task):**
- Hospital admin dashboard with statistics
- Doctor list and management UI
- Doctor detail/edit pages
- Hospital settings page

## Your Mission

Implement the **Hospital Admin Portal** that allows hospital administrators to:
- View their hospital's statistics and recent activity
- Manage their medical staff (doctors)
- View and edit doctor profiles
- Access hospital settings

---

## Files to Create

```
lib/actions/
└── hospital-admin-actions.ts          # CREATE - All server actions

components/locatomed/                     # CREATE THIS FOLDER
├── stat-card.tsx                      # CREATE - Reusable stat card
└── doctor-list.tsx                    # CREATE - Doctor list table

app/hospital-admin/
├── page.tsx                           # MODIFY - Enhance dashboard
├── doctors/
│   ├── page.tsx                       # CREATE - Doctor list page
│   ├── [id]/
│   │   └── page.tsx                   # CREATE - Doctor detail page
│   └── new/page.tsx                   # EXISTS - Enhance if needed
└── settings/
    └── page.tsx                       # CREATE - Hospital settings
```

---

## Implementation Requirements

### Code Standards

1. **TypeScript**: Fully typed, no `any` types
2. **Server Components by default**: Only use `'use client'` when needed
3. **Server Actions**: Use `'use server'` directive for all data mutations
4. **Auth Check**: Always verify session in server actions and pages
5. **French UI**: All text in French (matches existing app)
6. **Import Paths**: Use `@/` alias

### Auth Pattern

```typescript
import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

export default async function HospitalAdminPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/hospital-admin/login')
  }
  
  // ... rest of page
}
```

### Server Action Pattern

```typescript
'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getHospitalStats() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  
  const adminUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })
  
  if (!adminUser || adminUser.role !== 'hospital_admin') {
    throw new Error('Forbidden: Not a hospital admin')
  }
  
  const hospitalId = adminUser.hospitalId
  if (!hospitalId) {
    throw new Error('Hospital admin not associated with a hospital')
  }
  
  // ... query logic
  
  return data
}
```

---

## Feature Requirements

### 1. Enhanced Dashboard (`app/hospital-admin/page.tsx`)

**Requirements:**
- [ ] Display 3 stat cards:
  - Total Doctors (count of doctors in this hospital)
  - Today's Appointments (appointments scheduled today for hospital's doctors)
  - Hospital Name (with address)
- [ ] Quick actions section with buttons:
  - "Ajouter un Médecin" → `/hospital-admin/doctors/new`
  - "Voir Tous les Médecins" → `/hospital-admin/doctors`
  - "Paramètres" → `/hospital-admin/settings`
- [ ] Recent doctors section showing last 5 doctors added
- [ ] Each recent doctor shows: name, email, "Voir" button

**Server Actions Needed:**
- `getHospitalStats()` - returns total doctors, today's appointments, hospital info
- `getRecentDoctors(limit)` - returns last N doctors added to this hospital

**UI Components to Use:**
```typescript
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/locatomed/stat-card'
import { Users, Calendar, Building2, UserPlus } from 'lucide-react'
```

---

### 2. Doctor List Page (`app/hospital-admin/doctors/page.tsx`)

**Requirements:**
- [ ] Page title: "Médecins"
- [ ] Subtitle: "Gérez les médecins de votre hôpital"
- [ ] Search bar to filter doctors by name or email (client-side filtering)
- [ ] "Ajouter Médecin" button in search bar
- [ ] Table showing all doctors with columns:
  - Nom (name)
  - Email
  - Date d'ajout (join date)
  - Statut (status badge - always "Actif")
  - Actions (dropdown menu)
- [ ] Actions dropdown per doctor:
  - "Voir Détails" → `/hospital-admin/doctors/[id]`
  - "Modifier" → `/hospital-admin/doctors/[id]` (optional)
- [ ] Empty state if no doctors: "Aucun médecin pour le moment" with CTA
- [ ] Results count at bottom

**Server Actions Needed:**
- `getAllDoctors()` - returns all doctors for this hospital

**UI Components to Use:**
```typescript
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Search, MoreHorizontal } from 'lucide-react'
import { DoctorList } from '@/components/locatomed/doctor-list'
```

---

### 3. Doctor Detail Page (`app/hospital-admin/doctors/[id]/page.tsx`)

**Requirements:**
- [ ] Back button to return to doctor list
- [ ] Page title: Doctor's name
- [ ] Subtitle: "Détails du médecin"
- [ ] "Modifier" button (optional - can be non-functional)
- [ ] Two cards side-by-side:

**Card 1: Informations Personnelles**
- Nom Complet
- Email
- Date d'ajout
- Statut (badge)

**Card 2: Statistiques**
- Total Rendez-vous (count of appointments)

**Server Actions Needed:**
- `getDoctorById(doctorId)` - returns doctor info and stats, verifies doctor belongs to admin's hospital

**UI Components to Use:**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Calendar, ArrowLeft } from 'lucide-react'
```

---

### 4. Hospital Settings Page (`app/hospital-admin/settings/page.tsx`)

**Requirements:**
- [ ] Page title: "Paramètres"
- [ ] Subtitle: "Gérez votre profil et votre hôpital"
- [ ] Two cards:

**Card 1: Informations de l'Hôpital**
- Nom
- Adresse
- Téléphone (if available)
- All fields read-only (no editing for now)

**Card 2: Votre Profil**
- Nom
- Email
- Rôle (display "Administrateur d'Hôpital")
- All fields read-only

**Server Actions Needed:**
- None - just fetch data in page component

**UI Components to Use:**
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, User } from 'lucide-react'
```

---

## Server Actions to Implement

Create file: **`lib/actions/hospital-admin-actions.ts`**

```typescript
'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { users, appointments, hospitals } from '@/lib/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'

// 1. Get hospital statistics
export async function getHospitalStats() {
  // Get session
  // Get admin user
  // Verify role and hospitalId
  // Count doctors: WHERE role='doctor' AND hospitalId=X
  // Count today's appointments: JOIN with doctors, filter by today
  // Get hospital info
  // Return { totalDoctors, todayAppointments, hospital }
}

// 2. Get recent doctors
export async function getRecentDoctors(limit = 5) {
  // Get session
  // Get admin user
  // Verify hospitalId
  // Query doctors: WHERE role='doctor' AND hospitalId=X ORDER BY createdAt DESC LIMIT N
  // Return doctors array
}

// 3. Get all doctors for this hospital
export async function getAllDoctors(searchQuery?: string) {
  // Get session
  // Get admin user
  // Verify hospitalId
  // Query doctors: WHERE role='doctor' AND hospitalId=X
  // If searchQuery provided, add: AND (name LIKE %query% OR email LIKE %query%)
  // Order by createdAt DESC
  // Return doctors array
}

// 4. Get doctor by ID (with verification)
export async function getDoctorById(doctorId: number) {
  // Get session
  // Get admin user
  // Verify hospitalId
  // Query doctor: WHERE id=doctorId AND role='doctor' AND hospitalId=adminUser.hospitalId
  // If not found, throw error
  // Count appointments for this doctor
  // Return { doctor, stats: { totalAppointments } }
}

// 5. Update doctor (OPTIONAL - implement only if time allows)
export async function updateDoctor(
  doctorId: number,
  data: { name?: string; email?: string }
) {
  // Get session
  // Verify admin and hospital
  // Verify doctor belongs to hospital
  // Update doctor record
  // Revalidate paths
  // Return { success: true }
}
```

---

## Reusable Components

### StatCard Component (`components/locatomed/stat-card.tsx`)

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
}

export function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={trend.value > 0 ? 'text-green-600' : 'text-red-600'}>
              {trend.value > 0 ? '+' : ''}{trend.value}
            </span>
            {' '}{trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

### DoctorList Component (`components/locatomed/doctor-list.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Search } from 'lucide-react'
import Link from 'next/link'

interface Doctor {
  id: number
  name: string
  email: string
  createdAt: Date
}

interface DoctorListProps {
  initialDoctors: Doctor[]
}

export function DoctorList({ initialDoctors }: DoctorListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDoctors = initialDoctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link href="/hospital-admin/doctors/new">Ajouter Médecin</Link>
        </Button>
      </div>

      {/* Doctors Table */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            {searchQuery
              ? 'Aucun médecin trouvé pour cette recherche.'
              : 'Aucun médecin pour le moment.'}
          </p>
          {!searchQuery && (
            <Button asChild className="mt-4">
              <Link href="/hospital-admin/doctors/new">
                Ajouter votre premier médecin
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date d'ajout</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.email}</TableCell>
                  <TableCell>
                    {new Date(doctor.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Actif</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/hospital-admin/doctors/${doctor.id}`}>
                            Voir Détails
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {filteredDoctors.length} médecin{filteredDoctors.length !== 1 ? 's' : ''} trouvé
        {filteredDoctors.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
```

---

## Database Schema Reference

```typescript
// Users table
users: {
  id: number
  email: string
  name: string
  password: string
  role: 'patient' | 'doctor' | 'hospital_admin' | 'pharmacist'
  hospitalId?: number  // Links to hospitals table
  pharmacyId?: number
  createdAt: Date
  updatedAt: Date
}

// Hospitals table
hospitals: {
  id: number
  name: string
  address: string
  phone?: string
  latitude?: number
  longitude?: number
}

// Appointments table
appointments: {
  id: number
  patientId: number
  doctorId: number
  scheduledAt: Date
  status: 'scheduled' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}
```

---

## Testing Checklist

Use demo account:
```
Email: admin@locatomed.ma
Password: demo123
```

Verify:
- [ ] Can login successfully
- [ ] Dashboard shows correct number of doctors
- [ ] Dashboard shows today's appointments count
- [ ] Dashboard shows hospital name and address
- [ ] Recent doctors section shows last 5 doctors
- [ ] Clicking "Voir Tous les Médecins" goes to doctor list
- [ ] Doctor list shows all doctors from this hospital only
- [ ] Search bar filters doctors correctly
- [ ] Clicking doctor name/row goes to detail page
- [ ] Doctor detail page shows all information
- [ ] Back button works from doctor detail
- [ ] Settings page shows hospital and admin info

---

## Priority Order

1. **First**: `lib/actions/hospital-admin-actions.ts` (all server actions)
2. **Second**: `components/locatomed/stat-card.tsx` (reusable component)
3. **Third**: `app/hospital-admin/page.tsx` (dashboard)
4. **Fourth**: `components/locatomed/doctor-list.tsx` (reusable component)
5. **Fifth**: `app/hospital-admin/doctors/page.tsx` (doctor list)
6. **Sixth**: `app/hospital-admin/doctors/[id]/page.tsx` (doctor detail)
7. **Seventh**: `app/hospital-admin/settings/page.tsx` (settings)

---

## Success Criteria

✅ Hospital admin can:
- View dashboard with real statistics
- See list of all doctors in their hospital
- Search/filter doctors
- View individual doctor details
- Access hospital settings

✅ Code quality:
- No TypeScript errors
- All server actions have auth checks
- All pages verify user role
- Consistent French UI text
- Clean, readable code

---

## Additional Notes

- All doctors in the database already have `hospitalId` set
- The seed data includes demo doctors for testing
- Don't worry about creating new doctors - that form already exists
- Focus on READ operations, not UPDATE/DELETE
- Keep it simple - this is a hackathon, not production
- Reuse existing shadcn/ui components as much as possible

Good luck! 🚀
