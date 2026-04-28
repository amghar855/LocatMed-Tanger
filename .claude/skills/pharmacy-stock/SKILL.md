---
name: pharmacy-stock
description: Builds or modifies the pharmacist's stock management interface — viewing inventory, editing quantities, updating prices, flagging low stock. USE THIS SKILL whenever the user mentions stock, inventory, pharmacy dashboard, quantity management, or restocking.
---

# Pharmacy stock management

## Who uses this
Pharmacists only. Every server action starts with:
```typescript
const session = await requireRole("pharmacist");
```

A pharmacist is linked to exactly one `pharmacyId` in their user record.
They can ONLY see and edit stock for that pharmacy.

## UX

Single sortable table, one row per (medicine) the pharmacy stocks:
- Medicine name (+ active ingredient in smaller text)
- Category / dosage form
- Current quantity — inline editable
- Price in MAD — inline editable
- Last updated (relative, e.g. "il y a 2h")
- Row color: red if quantity=0, orange if <5

Filters at the top:
- Search by medicine name
- Toggle "Afficher uniquement les ruptures de stock"
- Toggle "Stock faible (<5)"

## Interaction pattern (optimistic updates)

```typescript
"use client";
const [optimistic, setOptimistic] = useOptimistic(stock);

async function handleEdit(stockId: number, quantity: number) {
  setOptimistic((prev) => prev.map(r =>
    r.id === stockId ? { ...r, quantity } : r
  ));
  const result = await updateStock({ stockId, quantity });
  if (!result.ok) {
    toast.error("Échec de mise à jour");
    // optimistic state reverts on next render
  } else {
    toast.success("Stock mis à jour");
  }
}
```

Debounce 500ms so rapid edits don't spam the DB.

## Server action (with critical scoping)

```typescript
// app/pharmacy/stock/actions.ts
"use server";
export async function updateStock(input: { stockId: number; quantity: number }) {
  const session = await requireRole("pharmacist");
  const parsed = StockUpdateInput.parse(input);

  if (parsed.quantity < 0) {
    return { ok: false, error: "Quantité négative interdite" };
  }

  // Get the pharmacist's pharmacyId
  const [me] = await db.select({ pharmacyId: users.pharmacyId })
    .from(users)
    .where(eq(users.id, session.user.id));
  if (!me?.pharmacyId) return { ok: false, error: "Pharmacie non assignée" };

  // Update ONLY if the stock row belongs to this pharmacy
  const result = await db.update(pharmacyStock)
    .set({ quantity: parsed.quantity, updatedAt: new Date() })
    .where(and(
      eq(pharmacyStock.id, parsed.stockId),
      eq(pharmacyStock.pharmacyId, me.pharmacyId),  // CRITICAL
    ));

  revalidatePath("/pharmacy/stock");
  return { ok: true };
}
```

The `and(id=X, pharmacyId=mine)` WHERE clause is the security boundary.
A pharmacist who crafts a request with another pharmacy's stockId will
get 0 rows affected, not an update.

## Add new medicine to stock
Separate flow: "Ajouter un médicament" button → searchable dropdown of
medicines not yet in stock → quantity + price form → insert row.

## Pitfalls
- Don't let quantity go negative — validate in Zod
- Don't allow editing stock rows that don't belong to this pharmacy —
  the scoped WHERE clause prevents it, but verify in tests too
- Don't forget `revalidatePath` after updates
- On-duty status (`isOnDuty` on pharmacies) is a separate admin flag,
  not pharmacist-editable in MVP
- Bulk actions ("restock all to 20") are nice-to-have but not hero
