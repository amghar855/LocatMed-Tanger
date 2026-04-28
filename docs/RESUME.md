# LOCATOMED — État du projet (Patient interface)

> Last updated: 2026-04-19

---

## 1. Vue d'ensemble

LOCATOMED est une plateforme de santé numérique légère dédiée à la ville de **Tanger, Maroc**.
Elle connecte patients, pharmacies, hôpitaux et médecins. L'interface patient est l'axe central du MVP : elle permet à n'importe quel résident de Tanger de localiser un médicament en pharmacie, de prendre rendez-vous avec un médecin et de consulter son dossier médical en ligne.

**Stack technique :**

| Couche | Choix |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| UI | Tailwind CSS + shadcn/ui |
| Base de données | SQLite via Drizzle ORM + better-sqlite3 (dev) / Turso libSQL (prod) |
| Auth | Auth.js v5 — Credentials provider + bcrypt |
| Cartes | Leaflet + react-leaflet + tuiles OpenStreetMap (CARTO Light) |
| Dates | date-fns + date-fns-tz (Africa/Casablanca) |
| Toasts | Sonner (via shadcn) |

---

## 2. Schéma de base de données

Toutes les tables sont définies dans `lib/db/schema.ts`. Les migrations générées par `drizzle-kit` sont dans `drizzle/migrations/`.

| Table | Rôle |
|---|---|
| `hospitals` | Hôpitaux de Tanger (nom, type, coordonnées GPS, spécialités JSON) |
| `pharmacies` | Pharmacies de Tanger (coordonnées, quartier, garde, horaires) |
| `users` | Tous les comptes (patient / doctor / pharmacist / hospital_admin) |
| `medicines` | Référentiel national data.gov.ma (~49 médicaments communs) |
| `pharmacy_stock` | Quantité + prix par couple (pharmacie, médicament) |
| `appointments` | Rendez-vous patient ↔ médecin dans un hôpital |
| `medical_records` | Dossier médical (diagnostic, notes, prescription JSON) |
| `patient_favorite_hospitals` | Hôpitaux favoris d'un patient (unique index sur patientId+hospitalId) |
| `reservations` | Réservation de médicament en pharmacie |
| `notification_requests` | Demandes de notification de stock par email / téléphone |

**Données de démonstration (après `npm run db:seed`) :**
- 5 hôpitaux de Tanger (2 publics, 1 CHU, 1 privé, 1 mère-enfant)
- 30+ pharmacies réparties dans les quartiers de Tanger (données OSM)
- 49 médicaments courants (Doliprane, Ventoline, Augmentin, Spasfon…)
- ~7 700 lignes de stock — 15 % en rupture, 10 % stock faible
- Comptes de démonstration :

| Email | Mot de passe | Rôle |
|---|---|---|
| `fatima@locatomed.ma` | `demo123` | Patient |
| `benjelloun@locatomed.ma` | `demo123` | Médecin (Hôpital Mohammed V) |
| `ahmed@locatomed.ma` | `demo123` | Pharmacien |

---

## 3. Authentification et autorisation

- **Auth.js v5** avec provider `Credentials` (email + mot de passe bcrypt).
- Le JWT embarque `user.id` et `user.role`; la session est hydratée via les callbacks `jwt` + `session` dans `lib/auth/index.ts`.
- `lib/auth/guards.ts` expose `requireSession()` et `requireRole(role)` — appelés en tête de chaque Server Action et page serveur.
- `middleware.ts` redirige les utilisateurs non authentifiés vers `/login` et les utilisateurs authentifiés à la racine `/` vers leur dashboard (`/patient`, `/doctor`, `/pharmacy`).
- L'accès croisé entre rôles est bloqué au niveau middleware.

---

## 4. Interface Patient — 9 routes

Toutes les routes commencent par `/patient/*` et sont protégées par `requireRole("patient")`.

### 4.1 Dashboard — `/patient/dashboard`

**Fichiers clés :**
- `app/patient/dashboard/page.tsx`
- `features/patient/components/dashboard/`
  - `quick-actions.tsx` — bannière CTA (réservation) + 4 tuiles d'accès rapide
  - `upcoming-reservation-card.tsx` — prochain rendez-vous (date, médecin, hôpital)
  - `summary-cards.tsx` — 5 compteurs statistiques (rendez-vous, dossiers, favoris…)
  - `favorites-preview.tsx` — aperçu des hôpitaux favoris

**Fonctions :**
- `getPatientDashboardData(patientId)` dans `features/patient/services/dashboard.ts`
- Agrège en une seule passe : prochain rendez-vous, statistiques, favoris

### 4.2 Découverte — `/patient/discover`

**Fichiers clés :**
- `app/patient/discover/page.tsx`
- `features/patient/components/discover/discover-client.tsx`
- `features/patient/components/discover/discover-map-leaflet.tsx`
- `features/patient/services/discover/index.ts`

**Fonctions :**
- Affichage plein-écran : carte à gauche, liste à droite (layout split)
- Filtre **hôpitaux** par type (public / privé / CHU) et spécialité
- Filtre **pharmacies** par garde (`isOnDuty`), rayon (0–20 km), et requête médicament
- Calcul de distance **haversine** pour chaque point par rapport à la position GPS de l'utilisateur
- Tri automatique par distance
- Rayon automatique calculé à partir de la pharmacie la plus proche
- Carte Leaflet avec `CircleMarker` (pas d'icônes par défaut), tuiles CARTO Light
- Clic sur un marqueur → panneau latéral de détail avec médicaments disponibles, horaires, quartier
- Navigation mobile via Sheet (menu déroulant)

### 4.3 Prise de rendez-vous — `/patient/booking`

**Fichiers clés :**
- `app/patient/booking/page.tsx`
- `app/patient/booking/actions.ts`
- `features/patient/components/booking/booking-form.tsx`
- `features/patient/services/booking/`

**Fonctions :**
- Formulaire **3 étapes** avec barre de progression :
  1. Recherche et sélection d'un hôpital (filtre texte, badges par type)
  2. Sélection de spécialité et de médecin
  3. Sélection de date/heure et motif de la consultation
- Pré-sélection de l'hôpital via `?hospitalId=` (lien depuis les favoris)
- Server Action `bookReservationAction` — valide, appelle `createReservation(patientId, data)`, toast de confirmation

### 4.4 Mes rendez-vous — `/patient/reservations`

**Fichiers clés :**
- `app/patient/reservations/page.tsx`
- `features/patient/components/booking/reservation-list.tsx`
- `features/patient/components/booking/cancel-reservation-button.tsx`

**Fonctions :**
- Liste tabulée : **À venir** / **Terminées** / **Annulées** avec compteurs par onglet
- Carte de rendez-vous : badge date (jour + mois), icônes hôpital / médecin / spécialité
- Bouton d'annulation avec spinner Loader2 et confirmation

### 4.5 Hôpitaux favoris — `/patient/favorites`

**Fichiers clés :**
- `app/patient/favorites/page.tsx`
- `features/patient/components/favorites/favorites-list.tsx`
- `features/patient/components/favorites/favorite-hospital-picker.tsx`
- `features/patient/components/favorites/favorite-toggle-form.tsx`
- `features/patient/services/favorites.ts`

**Fonctions :**
- Grille d'hôpitaux favoris avec badges type (Public/Privé/CHU), chips spécialités
- CTA "Réserver un rendez-vous" → `/patient/booking?hospitalId=...`
- Sélecteur d'ajout/suppression avec icône cœur
- Server Actions : `addFavoriteAction` / `removeFavoriteAction`
- Contrainte d'unicité en base (un patient ne peut pas ajouter deux fois le même hôpital)

### 4.6 Dossier médical — `/patient/folder`

**Fichiers clés :**
- `app/patient/folder/page.tsx`
- `features/patient/components/medical-folder/medical-folder-categories.tsx`
- `features/patient/components/medical-folder/medical-folder-filters.tsx`
- `features/patient/services/medical-folder.ts`

**Fonctions :**
- Hero violette avec nombre de consultations et de médecins
- Filtres (date, médecin, mot-clé dans le diagnostic) avec badge "Réinitialiser"
- Catégories de dossiers médicaux par type
- Données de démo : 3 consultations historiques pour Fatima

### 4.7 Recherche de médicaments — `/patient/medicine-search`

> **Fonctionnalité centrale** — voir section 5 pour le détail complet.

### 4.8 Scan d'ordonnance — `/patient/ordonnance-scan`

**Fichiers clés :**
- `app/patient/ordonnance-scan/page.tsx`
- `features/patient/components/ordonnance-scan/ordonnance-scan-client.tsx`
- `features/patient/services/ordonnance-scan.ts`

**Fonctions :**
- Upload de fichier (image/PDF) ou capture photo via `getUserMedia` + canvas snapshot
- Extraction du nom du médicament depuis le nom de fichier (placeholder MVP)
- Affichage de la disponibilité en pharmacie pour le médicament détecté
- Badge de stock (`StockBadge`) : En stock / Stock faible / Rupture

### 4.9 Assistant IA (Chatbot) — `/patient/chatbot`

**Fichiers clés :**
- `app/patient/chatbot/page.tsx`
- `app/patient/chatbot/actions.ts`
- `features/patient/components/chatbot/chatbot-client.tsx`
- `features/patient/services/chatbot.ts`

**Fonctions :**
- Interface de chat plein-écran avec avatar utilisateur
- Saisie vocale via `SpeechRecognition` API (locale `fr-FR`)
- Pièces jointes (jusqu'à 3 fichiers), capture caméra
- Textarea auto-redimensionnable, envoi par Entrée
- Détection d'intention côté serveur (`booking` / `pharmacy` / `discover` / `general`)
- Réponses contextuelles en **Darija** (arabe marocain)
- Suggestions cliquables (pharmacies de garde, hôpitaux par spécialité, actions rapides)
- Menu de navigation mobile (Sheet)

---

## 5. Fonctionnalité centrale : Trouver la pharmacie la plus proche par médicament

Cette fonctionnalité est le cœur du parcours de démonstration. Elle s'étend sur plusieurs couches.

### 5.1 Architecture du flux

```
Patient tape "paracetamol"
        │
        ▼
[MedicineSearchClient]
  - debounce 300ms
  - appelle searchMedicinesAction()
        │
        ▼
[Server Action] app/patient/medicine-search/actions.ts
  - requireRole("patient")
  - validateMedicineSearchInput (Zod, min 2 chars)
  - appelle searchMedicinesWithAvailability(query)
        │
        ▼
[Service] features/patient/services/medicine-search.ts
  - Drizzle : JOIN medicines ↔ pharmacy_stock ↔ pharmacies
  - WHERE name LIKE %query% OR activeIngredient LIKE %query%
  - Retourne MedicineSearchResponse
        │
        ▼
[Client] Trie par : stock_status DESC, distance ASC
  - Haversine entre position GPS user et coordonnées pharmacie
  - Affiche liste + carte Leaflet synchronisées
```

### 5.2 Requête SQL (Drizzle ORM)

Fichier : `features/patient/services/medicine-search.ts`

```typescript
const rows = await db
  .select({
    medicineId: medicines.id,
    medicineName: medicines.name,
    activeIngredient: medicines.activeIngredient,
    dosageForm: medicines.dosageForm,
    ppm: medicines.ppm,
    pharmacyId: pharmacies.id,
    pharmacyName: pharmacies.name,
    neighborhood: pharmacies.neighborhood,
    address: pharmacies.address,
    lat: pharmacies.lat,
    lng: pharmacies.lng,
    isOnDuty: pharmacies.isOnDuty,
    quantity: pharmacyStock.quantity,
    price: pharmacyStock.price,
  })
  .from(medicines)
  .leftJoin(pharmacyStock, eq(pharmacyStock.medicineId, medicines.id))
  .leftJoin(pharmacies, eq(pharmacyStock.pharmacyId, pharmacies.id))
  .where(
    sql`lower(${medicines.name}) LIKE lower(${like})
        OR lower(${medicines.activeIngredient}) LIKE lower(${like})`
  )
  .orderBy(medicines.name, desc(pharmacyStock.quantity));
```

La recherche s'étend à la fois sur le **nom commercial** et sur le **principe actif** (`activeIngredient`). Ainsi, chercher "paracétamol" retourne Doliprane, Efferalgan, Dafalgan, etc.

### 5.3 Tri côté client : stock + distance

Fichier : `features/patient/components/medicine-search/medicine-search-client.tsx`

```typescript
// Formule haversine (km)
function haversineKm(a: UserLocation, b: UserLocation) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Tri : stock d'abord, distance ensuite
const sortedPharmacies = [...activeItem.pharmacies]
  .map((p) => ({ ...p, distanceKm: haversineKm(userLocation, p) }))
  .sort((a, b) => {
    const byStatus = rankStock(b.stockStatus) - rankStock(a.stockStatus);
    if (byStatus !== 0) return byStatus;      // en stock > faible > rupture
    return a.distanceKm - b.distanceKm;       // puis la plus proche en premier
  });
```

**Règle de tri :** un médicament disponible à 5 km est toujours affiché avant un médicament en rupture à 100 m.

### 5.4 Statuts de stock

| Statut | Seuil | Badge |
|---|---|---|
| `in_stock` | quantité > 5 | Vert — "En stock" |
| `low_stock` | 0 < quantité ≤ 5 | Ambre — "Stock faible" |
| `out_of_stock` | quantité = 0 | Rose — "Rupture" |

### 5.5 Géolocalisation

- `navigator.geolocation.getCurrentPosition()` avec timeout 3 s
- Si refusée ou impossible : fallback silencieux sur le **centre de Tanger** (`lat: 35.7673, lng: -5.7998`) défini dans `features/patient/constants/tangier.ts`

### 5.6 Carte synchronisée

Fichier : `features/patient/components/medicine-search/pharmacy-map.tsx`

- Chargée en mode `dynamic(..., { ssr: false })` pour éviter l'erreur SSR Leaflet
- `CircleMarker` coloré selon le statut de stock (vert / ambre / rose)
- Tuiles CARTO Light (pas de clé API requise)
- Clic sur un marqueur → sélection de la pharmacie dans la liste
- Clic sur une pharmacie dans la liste → zoom sur le marqueur

### 5.7 Notifications de rupture de stock

Quand tous les stocks sont à zéro pour un médicament, le bouton "M'avertir quand disponible" apparaît.

**Fichiers :**
- `app/patient/medicine-search/actions.ts` — `requestMedicineBroadcastAction`
- `features/patient/services/medicine-search.ts` — `createBroadcastNotificationRequestsForMedicine`
- `features/patient/schemas/medicine-search.ts` — `medicineBroadcastInputSchema`

**Logique :**
1. Vérifie que le patient a un email ou un téléphone dans son profil
2. Récupère toutes les pharmacies de la base
3. Filtre celles qui ont déjà une requête `pending` pour ce couple (médicament, contact)
4. Insère les nouvelles lignes dans `notification_requests`
5. Retourne `{ createdCount, alreadyPendingCount, pharmacyCount }`

### 5.8 Requêtes suggérées

Quatre requêtes suggérées s'affichent sous la barre de recherche :
`["Doliprane", "Ventoline", "Augmentin", "Spasfon"]`

Un clic sur un chip exécute la recherche immédiatement (sans debounce).

### 5.9 Types TypeScript

```typescript
// features/patient/types/medicine-search.ts
type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

interface MedicinePharmacyAvailability {
  pharmacyId: string;
  pharmacyName: string;
  neighborhood: string | null;
  address: string | null;
  lat: number;
  lng: number;
  quantity: number;
  stockStatus: StockStatus;
  isOnDuty: boolean;
  price: number;
}

interface MedicineSearchItem {
  medicineId: string;
  medicineName: string;
  activeIngredient: string;
  dosageForm: string | null;
  ppm: number | null;    // Prix Public Maroc (MAD)
  pharmacies: MedicinePharmacyAvailability[];
}
```

---

## 6. Services patient — récapitulatif

| Fichier | Fonctions exportées |
|---|---|
| `services/dashboard.ts` | `getPatientDashboardData(patientId)` |
| `services/discover/index.ts` | `getHospitalsForDiscover(filters)`, `getPharmaciesForDiscover(filters)`, `getHospitalSpecialties()` |
| `services/booking/` | `getHospitalsForBooking()`, `getDoctorsByHospitalAndSpecialty()`, `createReservation(patientId, data)`, `cancelReservation(id, patientId)`, `getPatientReservations(patientId)` |
| `services/favorites.ts` | `getPatientFavorites(patientId)`, `addFavorite(patientId, hospitalId)`, `removeFavorite(patientId, hospitalId)`, `getAllHospitals()` |
| `services/medical-folder.ts` | `getPatientMedicalRecords(patientId, filters)` |
| `services/medicine-search.ts` | `searchMedicinesWithAvailability(query)`, `createBroadcastNotificationRequestsForMedicine(input)` |
| `services/ordonnance-scan.ts` | `getPharmacyAvailabilityForMedicine(query)` |
| `services/chatbot.ts` | `askPatientChatbot(question, patientId)`, `getPatientChatbotStarterContext()` |

---

## 7. Parcours de démonstration (hero flow)

1. **Fatima** se connecte (`fatima@locatomed.ma / demo123`) → redirigée vers `/patient/dashboard`
2. Elle clique sur "Médicaments" → `/patient/medicine-search`
3. Elle tape `"paracetamol"` → la liste s'affiche, triée par stock puis distance
4. Elle voit **"Doliprane 500mg"** disponible à la pharmacie la plus proche
5. Elle clique sur la carte → le marqueur vert est mis en évidence
6. Elle revient au dashboard, clique "Réserver" → `/patient/booking`
7. Elle sélectionne **Hôpital Mohammed V** → étape 2 → choisit Dr. Benjelloun (généraliste)
8. Étape 3 : sélectionne demain, entre un motif → confirme → toast de succès
9. **Dr. Benjelloun** se connecte (`benjelloun@locatomed.ma / demo123`) → voit Fatima dans ses rendez-vous
10. Il ouvre sa fiche, ajoute une note de consultation
11. Fatima revient sur `/patient/folder` → voit la mise à jour de son dossier

---

## 8. État TypeScript

Le projet passe `npx tsc --noEmit` sans erreur.

Corrections apportées dans cette session :
- `features/patient/actions/booking/index.ts` — `createReservation` appelée avec 1 argument au lieu de 2 (`patientId` manquant)
- `features/patient/services/medicine-search.ts` — `lat`, `lng`, `isOnDuty` potentiellement `null` depuis Drizzle, guards ajoutés
- `app/doctor/consultations/new/page.tsx` — `useSearchParams()` sans `<Suspense>`, page découpée en server + client
- `features/patient/components/discover/discover-client.tsx` — `selectedPharmacy` potentiellement `null` et `availableMedicines` potentiellement `undefined`, optional chaining ajouté

---

## 9. Scripts disponibles

```bash
npm run dev           # Next.js en mode développement (localhost:3000)
npm run build         # Build de production (TypeScript check inclus)
npm run db:generate   # Génère une migration Drizzle après modification du schéma
npm run db:migrate    # Applique les migrations sur data/locatomed.db
npm run db:seed       # Efface et réalimente la base avec les données de démo
```
