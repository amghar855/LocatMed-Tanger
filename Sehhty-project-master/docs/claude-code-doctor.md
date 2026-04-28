# Claude Code Prompt - Doctor Portal

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
- Database schema with: users, appointments, medical_records, prescriptions, medicines
- Rich seed data including demo appointments and patient medical history
- Route protection and role-based redirects
- shadcn/ui components already installed
- Doctor can log in at `/doctor/login`

❌ **Not Yet Built (Your Task):**
- Doctor dashboard with appointment statistics
- Appointment management UI
- Patient search and medical file viewer
- Consultation form with prescription builder

## Your Mission

Implement the **Doctor Portal** that allows doctors to:
- View their daily schedule and statistics
- Manage appointments (view, filter, mark complete)
- Search for patients and view medical histories
- Conduct consultations and create medical records
- Write prescriptions

---

## Files to Create

```
lib/actions/
└── doctor-actions.ts                  # CREATE - All server actions

components/locatomed/                     # CREATE THIS FOLDER IF NOT EXISTS
├── appointment-card.tsx               # CREATE - Single appointment card
├── appointment-list.tsx               # CREATE - Appointment list with filters
└── medical-record-timeline.tsx        # CREATE - Medical history display

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
2. **Server Components by default**: Only use `'use client'` for forms and interactivity
3. **Server Actions**: Use `'use server'` directive for all data mutations
4. **Auth Check**: Always verify session and role in server actions
5. **French UI**: All text in French (matches existing app)
6. **Import Paths**: Use `@/` alias

### Auth Pattern

```typescript
import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

export default async function DoctorPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/doctor/login')
  }
  
  // ... rest of page
}
```

### Server Action Pattern

```typescript
'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { users, appointments } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function getDoctorAppointments() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  
  const doctorUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })
  
  if (!doctorUser || doctorUser.role !== 'doctor') {
    throw new Error('Forbidden: Not a doctor')
  }
  
  // ... query logic
  
  return data
}
```

---

## Feature Requirements

### 1. Enhanced Dashboard (`app/doctor/page.tsx`)

**Requirements:**
- [ ] Display 3 stat cards:
  - Rendez-vous Aujourd'hui (today's appointment count)
  - Patients Cette Semaine (appointments in last 7 days)
  - Dossiers en Attente (completed appointments without medical records)
- [ ] Quick actions section with buttons:
  - "Mes Rendez-vous" → `/doctor/appointments`
  - "Rechercher un Patient" → `/doctor/patients`
  - "Nouvelle Consultation" → `/doctor/consultations/new`
- [ ] Upcoming appointments widget showing next 5 appointments
- [ ] Each appointment card shows: patient name, date, time, "Voir" button
- [ ] "Voir Tous les Rendez-vous" button if appointments exist

**Server Actions Needed:**
- `getDoctorStats()` - returns todayAppointments, weekPatients, pendingRecords
- `getUpcomingAppointments(limit)` - returns next N scheduled appointments with patient info

**UI Components to Use:**
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppointmentCard } from '@/components/locatomed/appointment-card'
import { Calendar, Users, FileText, Plus, Search } from 'lucide-react'
```

---

### 2. Appointment List Page (`app/doctor/appointments/page.tsx`)

**Requirements:**
- [ ] Page title: "Mes Rendez-vous"
- [ ] Subtitle: "Gérez vos consultations"
- [ ] Tabs to filter appointments:
  - Tous (all appointments)
  - Prévus (scheduled)
  - Terminés (completed)
  - Annulés (cancelled)
- [ ] Separate "Aujourd'hui" section showing today's appointments
- [ ] "Autres" section for past/future appointments
- [ ] Each appointment card shows: patient name, date, time, status badge
- [ ] Click appointment to go to detail page
- [ ] Empty state: "Aucun rendez-vous" message

**Server Actions Needed:**
- `getAllAppointments(statusFilter?)` - returns all doctor's appointments, optionally filtered by status

**UI Components to Use:**
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppointmentList } from '@/components/locatomed/appointment-list'
import { AppointmentCard } from '@/components/locatomed/appointment-card'
```

---

### 3. Appointment Detail Page (`app/doctor/appointments/[id]/page.tsx`)

**Requirements:**
- [ ] Back button to return to appointments
- [ ] Page title: "Rendez-vous avec [Patient Name]"
- [ ] Subtitle: Full date in French format
- [ ] Status badge (Prévu/Terminé/Annulé)
- [ ] Two cards side-by-side:

**Card 1: Détails du Rendez-vous**
- Date (formatted in French)
- Heure (time)

**Card 2: Informations Patient**
- Nom (patient name)
- Email (patient email)
- "Voir Dossier Médical" button → `/doctor/patients/[patientId]`

**Actions Card (only if status is 'scheduled'):**
- "Commencer la Consultation" button → `/doctor/consultations/new?patientId=X&appointmentId=Y`
- "Annuler le Rendez-vous" button (optional functionality)

**Server Actions Needed:**
- `getAppointmentById(appointmentId)` - returns appointment with patient info, verifies it belongs to this doctor

**UI Components to Use:**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Mail, ArrowLeft, FileText } from 'lucide-react'
```

---

### 4. Patient Search Page (`app/doctor/patients/page.tsx`)

**Requirements:**
- [ ] Page title: "Rechercher un Patient"
- [ ] Subtitle: "Trouvez un patient par nom ou email"
- [ ] Search bar with search button
- [ ] Search button disabled if query < 2 characters
- [ ] "Recherche..." loading state on button
- [ ] Results section showing patient cards
- [ ] Each patient card shows: name, email, "Voir Dossier" button
- [ ] Results count message
- [ ] Empty state if no results: "Aucun patient trouvé"
- [ ] Must be a CLIENT COMPONENT (uses useState)

**Server Actions Needed:**
- `searchPatients(query)` - returns patients matching name or email (minimum 2 chars)

**UI Components to Use:**
```typescript
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, User } from 'lucide-react'
```

---

### 5. Patient Medical File Page (`app/doctor/patients/[id]/page.tsx`)

**Requirements:**
- [ ] Back button to return to search
- [ ] Page title: "Dossier Médical"
- [ ] Subtitle: Patient name
- [ ] "Nouvelle Consultation" button → `/doctor/consultations/new?patientId=X`
- [ ] Patient info card showing:
  - Nom Complet
  - Email
- [ ] "Historique Médical" section title
- [ ] Medical record timeline component showing all past records
- [ ] Each record shows:
  - Diagnosis (as title)
  - Date (as badge)
  - Doctor name
  - Notes (if any)
  - Prescriptions list (if any) with medicine name, dosage, duration
- [ ] Empty state: "Aucun dossier médical pour ce patient"

**Server Actions Needed:**
- `getPatientById(patientId)` - returns patient info
- `getPatientMedicalRecords(patientId)` - returns all medical records with doctor and prescriptions

**UI Components to Use:**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MedicalRecordTimeline } from '@/components/locatomed/medical-record-timeline'
import { User, Mail, ArrowLeft, Plus } from 'lucide-react'
```

---

### 6. New Consultation Page (`app/doctor/consultations/new/page.tsx`)

**Requirements:**
- [ ] Get `patientId` and optional `appointmentId` from URL query params
- [ ] If no patientId, show: "Veuillez sélectionner un patient" with button to search
- [ ] Page title: "Nouvelle Consultation"
- [ ] Subtitle: "Patient: [Patient Name]"
- [ ] Must be a CLIENT COMPONENT (form with state)

**Form Section 1: Diagnostic**
- [ ] Diagnostic field (required, text input)
- [ ] Notes field (optional, textarea)

**Form Section 2: Ordonnance**
- [ ] Medicine search input with autocomplete
- [ ] Search shows results as clickable list
- [ ] Click medicine to add to prescription list
- [ ] Each prescription shows:
  - Medicine name
  - Posologie field (required) - e.g., "2 comprimés"
  - Durée field (required) - e.g., "7 jours"
  - Instructions field (optional) - e.g., "Après les repas"
  - Delete button
- [ ] Empty state: "Aucun médicament prescrit"

**Form Actions:**
- [ ] "Annuler" button → goes back
- [ ] "Enregistrer la Consultation" button (disabled while submitting)
- [ ] On success: toast message + redirect to patient file or appointment
- [ ] On error: toast error message

**Server Actions Needed:**
- `searchMedicines(query)` - returns medicines matching name (minimum 2 chars)
- `createMedicalRecord(data)` - creates medical record + prescriptions, marks appointment as completed

**UI Components to Use:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
```

---

## Server Actions to Implement

Create file: **`lib/actions/doctor-actions.ts`**

```typescript
'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { users, appointments, medicalRecords, prescriptions, medicines } from '@/lib/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// 1. Get doctor statistics
export async function getDoctorStats() {
  // Get session and verify doctor role
  // Count today's appointments (WHERE doctorId=X AND scheduledAt is today)
  // Count week's appointments (WHERE doctorId=X AND scheduledAt >= 7 days ago)
  // Count pending records (appointments completed but no medical record)
  // Return { todayAppointments, weekPatients, pendingRecords }
}

// 2. Get upcoming appointments
export async function getUpcomingAppointments(limit = 5) {
  // Get session and verify doctor
  // Query appointments WHERE doctorId=X AND status='scheduled' AND scheduledAt >= now
  // Order by scheduledAt ASC
  // Include patient info using 'with' relation
  // Limit to N results
  // Return appointments with patient data
}

// 3. Get all appointments with optional filter
export async function getAllAppointments(statusFilter?: string) {
  // Get session and verify doctor
  // Query appointments WHERE doctorId=X
  // If statusFilter provided and not 'all', add: AND status=statusFilter
  // Order by scheduledAt DESC
  // Include patient info
  // Return appointments array
}

// 4. Get appointment by ID
export async function getAppointmentById(appointmentId: number) {
  // Get session and verify doctor
  // Query appointment WHERE id=appointmentId AND doctorId=doctorUser.id
  // Include patient and medicalRecord relations
  // If not found, throw error
  // Return appointment with patient info
}

// 5. Update appointment status (OPTIONAL)
export async function updateAppointmentStatus(
  appointmentId: number,
  status: 'scheduled' | 'completed' | 'cancelled'
) {
  // Get session and verify doctor
  // Update appointment SET status=X, updatedAt=now WHERE id=appointmentId
  // Revalidate paths
  // Return { success: true }
}

// 6. Search patients
export async function searchPatients(query: string) {
  // Get session and verify doctor
  // If query < 2 chars, return []
  // Query users WHERE role='patient' AND (name LIKE %query% OR email LIKE %query%)
  // Limit to 10 results
  // Return patients array
}

// 7. Get patient by ID
export async function getPatientById(patientId: number) {
  // Get session and verify doctor
  // Query user WHERE id=patientId AND role='patient'
  // If not found, throw error
  // Return patient
}

// 8. Get patient medical records
export async function getPatientMedicalRecords(patientId: number) {
  // Get session and verify doctor
  // Query medicalRecords WHERE patientId=X
  // Order by createdAt DESC
  // Include doctor and prescriptions (with medicine data)
  // Return records array
}

// 9. Create medical record
export async function createMedicalRecord(data: {
  patientId: number
  appointmentId?: number
  diagnosis: string
  notes?: string
  prescriptions: Array<{
    medicineId: number
    dosage: string
    duration: string
    instructions?: string
  }>
}) {
  // Get session and verify doctor
  // Insert medical record
  // If prescriptions exist, insert all prescriptions
  // If appointmentId provided, update appointment status to 'completed'
  // Revalidate relevant paths
  // Return { success: true, recordId }
}

// 10. Search medicines
export async function searchMedicines(query: string) {
  // Get session (basic auth check)
  // If query < 2 chars, return []
  // Query medicines WHERE name LIKE %query%
  // Limit to 10 results
  // Return medicines array
}
```

---

## Reusable Components

### AppointmentCard Component (`components/locatomed/appointment-card.tsx`)

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User } from 'lucide-react'
import Link from 'next/link'

interface AppointmentCardProps {
  appointment: {
    id: number
    scheduledAt: Date
    status: string
    patient: {
      name: string
      email: string
    }
  }
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const appointmentDate = new Date(appointment.scheduledAt)
  const time = appointmentDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const date = appointmentDate.toLocaleDateString('fr-FR')

  const statusColors = {
    scheduled: 'bg-teal-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
  }

  const statusLabels = {
    scheduled: 'Prévu',
    completed: 'Terminé',
    cancelled: 'Annulé',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{appointment.patient.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {date}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </div>
            </div>
            <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
              {statusLabels[appointment.status as keyof typeof statusLabels]}
            </Badge>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/doctor/appointments/${appointment.id}`}>
              Voir
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### AppointmentList Component (`components/locatomed/appointment-list.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { AppointmentCard } from './appointment-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Appointment {
  id: number
  scheduledAt: Date
  status: string
  patient: {
    name: string
    email: string
  }
}

interface AppointmentListProps {
  appointments: Appointment[]
}

export function AppointmentList({ appointments }: AppointmentListProps) {
  const [activeTab, setActiveTab] = useState('all')

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'all') return true
    return apt.status === activeTab
  })

  // Separate today's appointments
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayAppointments = filteredAppointments.filter((apt) => {
    const aptDate = new Date(apt.scheduledAt)
    return aptDate >= today && aptDate < tomorrow
  })

  const otherAppointments = filteredAppointments.filter((apt) => {
    const aptDate = new Date(apt.scheduledAt)
    return aptDate < today || aptDate >= tomorrow
  })

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="all">Tous</TabsTrigger>
        <TabsTrigger value="scheduled">Prévus</TabsTrigger>
        <TabsTrigger value="completed">Terminés</TabsTrigger>
        <TabsTrigger value="cancelled">Annulés</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="space-y-6 mt-6">
        {todayAppointments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Aujourd'hui</h3>
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          </div>
        )}

        {otherAppointments.length > 0 && (
          <div>
            {todayAppointments.length > 0 && (
              <h3 className="text-lg font-semibold mb-3">Autres</h3>
            )}
            <div className="space-y-3">
              {otherAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          </div>
        )}

        {filteredAppointments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aucun rendez-vous {activeTab !== 'all' ? activeTab : ''}
          </p>
        )}
      </TabsContent>
    </Tabs>
  )
}
```

### MedicalRecordTimeline Component (`components/locatomed/medical-record-timeline.tsx`)

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Pill } from 'lucide-react'

interface MedicalRecordTimelineProps {
  records: Array<{
    id: number
    diagnosis: string
    notes: string | null
    createdAt: Date
    doctor: {
      name: string
    }
    prescriptions: Array<{
      medicine: {
        name: string
      }
      dosage: string
      duration: string
    }>
  }>
}

export function MedicalRecordTimeline({ records }: MedicalRecordTimelineProps) {
  if (records.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Aucun dossier médical pour ce patient
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{record.diagnosis}</CardTitle>
              <Badge variant="outline">
                {new Date(record.createdAt).toLocaleDateString('fr-FR')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Dr. {record.doctor.name}</span>
            </div>

            {record.notes && (
              <div>
                <p className="text-sm font-medium mb-1">Notes:</p>
                <p className="text-sm text-muted-foreground">{record.notes}</p>
              </div>
            )}

            {record.prescriptions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Prescriptions:
                </p>
                <div className="space-y-2">
                  {record.prescriptions.map((prescription, idx) => (
                    <div key={idx} className="text-sm bg-muted p-2 rounded">
                      <p className="font-medium">{prescription.medicine.name}</p>
                      <p className="text-muted-foreground">
                        {prescription.dosage} - {prescription.duration}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

---

## Database Schema Reference

```typescript
// Appointments
appointments: {
  id: number
  patientId: number
  doctorId: number
  scheduledAt: Date
  status: 'scheduled' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

// Medical Records
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

// Prescriptions
prescriptions: {
  id: number
  medicalRecordId: number
  medicineId: number
  dosage: string
  duration: string
  instructions?: string
  createdAt: Date
}

// Medicines
medicines: {
  id: number
  name: string
  activeIngredient: string
  form: string
  dosage?: string
}

// Users (patients, doctors)
users: {
  id: number
  email: string
  name: string
  role: 'patient' | 'doctor' | 'hospital_admin' | 'pharmacist'
  createdAt: Date
}
```

---

## Testing Checklist

Use demo account:
```
Email: benjelloun@locatomed.ma
Password: demo123
```

Verify:
- [ ] Can login successfully
- [ ] Dashboard shows today's appointment count
- [ ] Dashboard shows upcoming appointments
- [ ] Appointment list shows all appointments
- [ ] Can filter appointments by status (tabs work)
- [ ] Today's appointments appear in separate section
- [ ] Clicking appointment goes to detail page
- [ ] Appointment detail shows patient info
- [ ] "View Medical File" button works
- [ ] Can search for patients (minimum 2 characters)
- [ ] Patient file shows medical history timeline
- [ ] Can start new consultation from patient file
- [ ] Can start consultation from appointment
- [ ] Medicine search autocomplete works
- [ ] Can add multiple prescriptions
- [ ] Can remove prescriptions
- [ ] Form validates required fields
- [ ] Consultation saves successfully
- [ ] New record appears in patient file
- [ ] Linked appointment marked as completed

---

## Priority Order

1. **First**: `lib/actions/doctor-actions.ts` (all server actions)
2. **Second**: `components/locatomed/appointment-card.tsx`
3. **Third**: `app/doctor/page.tsx` (dashboard)
4. **Fourth**: `components/locatomed/appointment-list.tsx`
5. **Fifth**: `app/doctor/appointments/page.tsx` (appointment list)
6. **Sixth**: `app/doctor/appointments/[id]/page.tsx` (appointment detail)
7. **Seventh**: `components/locatomed/medical-record-timeline.tsx`
8. **Eighth**: `app/doctor/patients/page.tsx` (patient search)
9. **Ninth**: `app/doctor/patients/[id]/page.tsx` (patient file)
10. **Tenth**: `app/doctor/consultations/new/page.tsx` (consultation form)

---

## Success Criteria

✅ Doctor can:
- View dashboard with real statistics
- See and filter appointments
- View appointment details
- Search for patients
- View patient medical histories
- Create new consultations with prescriptions
- See new records appear in patient files

✅ Code quality:
- No TypeScript errors
- All server actions have auth checks
- Forms have proper validation
- Success/error feedback with toasts
- Clean, readable code
- Consistent French UI text

---

## Additional Notes

- The seed data includes demo appointments and medical records for testing
- Patient "Fatima" (`fatima@locatomed.ma`) has existing medical history
- All medicines are pre-seeded in the database (49 medicines)
- When creating a medical record linked to an appointment, mark the appointment as 'completed'
- Use `revalidatePath()` after mutations to refresh the UI
- Client components need `'use client'` directive at the top
- Keep forms simple - basic validation is enough for hackathon

Good luck! 🚀
