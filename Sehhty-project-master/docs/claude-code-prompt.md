# Claude Code Implementation Prompt - LOCATOMED Hospital & Doctor Features

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
- Database schema with: users, hospitals, appointments, medical_records, prescriptions, medicines
- Rich seed data (5 hospitals, 158 pharmacies, 49 medicines, demo users with medical history)
- Route protection and role-based redirects
- shadcn/ui components already installed

❌ **Not Yet Built (Your Tasks):**
- Hospital admin dashboard and doctor management UI
- Doctor dashboard and consultation workflow
- Patient medical file viewer
- Appointment management system

## Your Mission

Implement TWO complete portals:

### 1. Hospital Admin Portal (`/hospital-admin/*`)
- Enhanced dashboard with statistics
- Doctor list with search/filter
- Doctor detail and edit pages
- Hospital settings page

### 2. Doctor Portal (`/doctor/*`)
- Enhanced dashboard with appointment stats
- Appointment list and detail pages
- Patient search and medical file viewer
- New consultation form with prescription builder

---

## File Structure to Create

```
lib/actions/
├── hospital-admin-actions.ts          # CREATE - All hospital admin server actions
└── doctor-actions.ts                  # CREATE - All doctor server actions

components/locatomed/                     # CREATE THIS FOLDER
├── stat-card.tsx                      # CREATE - Reusable stat card component
├── doctor-list.tsx                    # CREATE - Doctor list table
├── appointment-card.tsx               # CREATE - Single appointment card
├── appointment-list.tsx               # CREATE - Appointment list with filters
└── medical-record-timeline.tsx        # CREATE - Medical history display

app/hospital-admin/
├── page.tsx                           # MODIFY - Enhance dashboard
├── doctors/
│   ├── page.tsx                       # CREATE - Doctor list page
│   ├── [id]/
│   │   └── page.tsx                   # CREATE - Doctor detail/edit page
│   └── new/page.tsx                   # EXISTS - Enhance if needed
└── settings/
    └── page.tsx                       # CREATE - Hospital settings

app/doctor/
├── page.tsx                           # MODIFY - Enhance dashboard
├── appointments/
│   ├── page.tsx                       # CREATE - Appointment list
│   └── [id]/
│       └── page.tsx                   # CREATE - Appointment detail
├── patients/
│   ├── page.tsx                       # CREATE - Patient search
│   └── [id]/
│       └── page.tsx                   # CREATE - Patient medical file
└── consultations/
    └── new/
        └── page.tsx                   # CREATE - New consultation form
```

---

## Implementation Requirements

### Code Standards

1. **TypeScript**: Fully typed, no `any` types
2. **Server Components by default**: Only use `'use client'` when needed (forms, interactivity)
3. **Server Actions**: Use `'use server'` directive for all data mutations
4. **Auth Check**: Always verify session in server actions and pages
5. **Error Handling**: Wrap server actions in try-catch, use `toast` for user feedback
6. **French UI**: All text in French (matches existing app)
7. **Import Paths**: Use `@/` alias for all imports

### Database Access Pattern

```typescript
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { users, appointments, medicalRecords, prescriptions, medicines, hospitals } from '@/lib/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'

// Example server action
export async function getHospitalStats() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  const adminUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })
  
  if (!adminUser || adminUser.role !== 'hospital_admin') {
    throw new Error('Forbidden')
  }
  
  // ... query logic
}
```

### Component Pattern

```typescript
// Server Component (default)
import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getSomeData } from '@/lib/actions/...'

export default async function SomePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  
  const data = await getSomeData()
  
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

```typescript
// Client Component (for forms, interactivity)
'use client'

import { useState } from 'react'
import { someAction } from '@/lib/actions/...'
import { toast } from 'sonner'

export function SomeForm() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await someAction(formData)
      toast.success('Success!')
    } catch (error) {
      toast.error('Error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  return <form onSubmit={handleSubmit}>{/* ... */}</form>
}
```

---

## Detailed Feature Requirements

### Hospital Admin Features

#### 1. Enhanced Dashboard (`app/hospital-admin/page.tsx`)
- [ ] Display stat cards: Total Doctors, Today's Appointments, Hospital Name
- [ ] Show quick action buttons: Add Doctor, View All Doctors, Settings
- [ ] Display recent doctors (last 5 added)
- [ ] Use `getHospitalStats()` and `getRecentDoctors()` server actions

#### 2. Doctor List (`app/hospital-admin/doctors/page.tsx`)
- [ ] Table showing: name, email, join date, status
- [ ] Search bar to filter by name/email
- [ ] "Add Doctor" button linking to `/hospital-admin/doctors/new`
- [ ] Actions dropdown per doctor: View Details, Edit
- [ ] Use `getAllDoctors()` server action

#### 3. Doctor Detail (`app/hospital-admin/doctors/[id]/page.tsx`)
- [ ] Display doctor info: name, email, join date, status
- [ ] Show statistics: total appointments
- [ ] Edit button (functionality optional if time-limited)
- [ ] Back button to doctor list
- [ ] Use `getDoctorById()` server action

#### 4. Settings (`app/hospital-admin/settings/page.tsx`)
- [ ] Display hospital information: name, address, phone
- [ ] Display admin profile: name, email, role
- [ ] Read-only for now (edit functionality optional)

### Doctor Features

#### 1. Enhanced Dashboard (`app/doctor/page.tsx`)
- [ ] Stat cards: Today's Appointments, Patients This Week, Pending Records
- [ ] Upcoming appointments widget (next 5)
- [ ] Quick actions: My Appointments, Search Patient, New Consultation
- [ ] Use `getDoctorStats()` and `getUpcomingAppointments()` server actions

#### 2. Appointment List (`app/doctor/appointments/page.tsx`)
- [ ] Tabs to filter: All, Scheduled, Completed, Cancelled
- [ ] Separate "Today" section
- [ ] Each appointment shows: patient name, date, time, status
- [ ] Click appointment to view details
- [ ] Use `getAllAppointments()` server action

#### 3. Appointment Detail (`app/doctor/appointments/[id]/page.tsx`)
- [ ] Show appointment info: date, time, status
- [ ] Show patient info: name, email
- [ ] "View Medical File" button linking to patient file
- [ ] "Start Consultation" button (if scheduled)
- [ ] Use `getAppointmentById()` server action

#### 4. Patient Search (`app/doctor/patients/page.tsx`)
- [ ] Search input with "Search" button
- [ ] Results show patient cards with name, email
- [ ] "View Medical File" button per patient
- [ ] Use `searchPatients()` server action (client component)

#### 5. Patient Medical File (`app/doctor/patients/[id]/page.tsx`)
- [ ] Patient demographics: name, email
- [ ] "New Consultation" button
- [ ] Medical history timeline component
- [ ] Each record shows: diagnosis, date, doctor, notes, prescriptions
- [ ] Use `getPatientById()` and `getPatientMedicalRecords()` server actions

#### 6. New Consultation (`app/doctor/consultations/new/page.tsx`)
- [ ] Get patientId from URL query params
- [ ] Form fields: diagnosis (required), notes (optional)
- [ ] Medicine search autocomplete
- [ ] Add multiple prescriptions with: medicine, dosage, duration, instructions
- [ ] Submit creates medical record + prescriptions
- [ ] Auto-complete linked appointment if appointmentId provided
- [ ] Use `createMedicalRecord()` and `searchMedicines()` server actions (client component)

---

## Server Actions to Implement

### Hospital Admin Actions (`lib/actions/hospital-admin-actions.ts`)

```typescript
export async function getHospitalStats()
export async function getRecentDoctors(limit?: number)
export async function getAllDoctors(searchQuery?: string)
export async function getDoctorById(doctorId: number)
export async function updateDoctor(doctorId: number, data: UpdateDoctorInput)  // Optional
```

### Doctor Actions (`lib/actions/doctor-actions.ts`)

```typescript
export async function getDoctorStats()
export async function getUpcomingAppointments(limit?: number)
export async function getAllAppointments(statusFilter?: string)
export async function getAppointmentById(appointmentId: number)
export async function updateAppointmentStatus(appointmentId: number, status: string)
export async function searchPatients(query: string)
export async function getPatientById(patientId: number)
export async function getPatientMedicalRecords(patientId: number)
export async function createMedicalRecord(data: CreateRecordInput)
export async function searchMedicines(query: string)
```

---

## Database Schema Reference

You have these tables available:

```typescript
// Users table
users: {
  id: number
  email: string
  name: string
  password: string
  role: 'patient' | 'doctor' | 'hospital_admin' | 'pharmacist'
  hospitalId?: number
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

// Medical Records table
medicalRecords: {
  id: number
  patientId: number
  doctorId: number
  appointmentId?: number
  diagnosis: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Prescriptions table
prescriptions: {
  id: number
  medicalRecordId: number
  medicineId: number
  dosage: string
  duration: string
  instructions?: string
  createdAt: Date
}

// Medicines table
medicines: {
  id: number
  name: string
  activeIngredient: string
  form: string
  dosage?: string
}
```

---

## UI Components Available

You can import these shadcn/ui components:

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
```

Icons from lucide-react:
```typescript
import { Calendar, Users, FileText, Search, Plus, ArrowLeft, MoreHorizontal, User, Mail, Clock, Building2, Pill, Trash2 } from 'lucide-react'
```

---

## Demo Accounts for Testing

```
Hospital Admin:
Email: admin@locatomed.ma
Password: demo123

Doctor:
Email: benjelloun@locatomed.ma
Password: demo123

Patient:
Email: fatima@locatomed.ma
Password: demo123
```

---

## Testing Checklist

After implementation, verify:

### Hospital Admin Portal
- [ ] Login as `admin@locatomed.ma`
- [ ] Dashboard shows correct stats
- [ ] Doctor list displays all doctors from admin's hospital only
- [ ] Search filters work
- [ ] Click doctor shows detail page
- [ ] Settings page shows hospital info

### Doctor Portal
- [ ] Login as `benjelloun@locatomed.ma`
- [ ] Dashboard shows today's appointments
- [ ] Appointment list shows all appointments
- [ ] Filter by status works
- [ ] Click appointment shows details
- [ ] Patient search finds patients
- [ ] Patient file shows medical history
- [ ] Can create new consultation with prescription
- [ ] New record appears in patient file after creation

---

## Success Criteria

Your implementation is successful when:

1. ✅ Both dashboards show real data from database
2. ✅ Hospital admin can view and manage doctors
3. ✅ Doctor can view appointments and patient files
4. ✅ Doctor can create consultations with prescriptions
5. ✅ All forms have proper validation and error handling
6. ✅ UI is clean, consistent, and uses existing design system
7. ✅ All features work with demo accounts
8. ✅ No TypeScript errors
9. ✅ Code follows Next.js 15 best practices

---

## Priority Order

If time is limited, implement in this order:

**Phase 1 (Must Have):**
1. Server actions in `lib/actions/`
2. Hospital admin dashboard
3. Doctor dashboard
4. Doctor list page
5. Appointment list page

**Phase 2 (High Priority):**
6. Patient medical file viewer
7. New consultation form
8. Appointment detail page
9. Doctor detail page

**Phase 3 (Nice to Have):**
10. Settings page
11. Advanced search/filters
12. Doctor edit functionality

---

## Key Constraints

- ❌ NO external API calls (everything is local SQLite)
- ❌ NO OAuth or magic links (credential auth only)
- ❌ NO file uploads or images in this phase
- ❌ NO real-time features or websockets
- ❌ NO email sending
- ✅ YES focus on CRUD operations and data display
- ✅ YES reuse existing UI components
- ✅ YES follow existing code patterns from auth system

---

## Additional Notes

- The seed data already has appointments and medical records for demo
- All French text should match the tone of existing pages
- Route protection is handled in `proxy.ts` - don't worry about it
- Use `revalidatePath()` after mutations to refresh data
- Keep server actions simple: one action = one database operation
- Let TypeScript guide you - the schema types are already defined

---

## Start Here

1. **First**: Create `lib/actions/` folder and both action files
2. **Then**: Create `components/locatomed/` folder and shared components
3. **Next**: Implement hospital admin pages
4. **Finally**: Implement doctor pages

Good luck! 🚀
