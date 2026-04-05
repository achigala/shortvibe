# Design: Project Income Form — Dropdown & Overage Validation Fixes

**Date:** 2026-04-05
**File:** `components/project-detail-client.tsx`
**Status:** Approved

---

## Problem Summary

Two issues on the project detail page's income entry form (การเงินโปรเจค section, visible to BOSS/DEVELOPER only):

1. **ประเภท dropdown** uses a native HTML `<select>` instead of the project-standard `SearchableSelect` component.
2. **จำนวนเงิน field** has no validation against the project's remaining budget — entering an amount that exceeds the remaining value is currently allowed silently.

---

## Fix 1 — Replace Native `<select>` with `SearchableSelect`

### Context

A fully-built `SearchableSelect` component already exists at `components/ui/searchable-select.tsx`. It is used elsewhere in the project and is the standard for all dropdown fields. The income form is the only place using a native `<select>`.

### Design

- Extract the 7 hardcoded category options into a named constant at the top of the relevant section:

```ts
const REVENUE_TYPE_OPTIONS = [
  { value: "รายได้โปรเจค", label: "รายได้โปรเจค" },
  { value: "มัดจำ", label: "มัดจำ" },
  { value: "งวดที่ 1", label: "งวดที่ 1" },
  { value: "งวดที่ 2", label: "งวดที่ 2" },
  { value: "งวดที่ 3", label: "งวดที่ 3" },
  { value: "งวดสุดท้าย", label: "งวดสุดท้าย" },
  { value: "อื่นๆ", label: "อื่นๆ" },
]
```

- Replace the native `<select>` JSX with:

```tsx
<SearchableSelect
  options={REVENUE_TYPE_OPTIONS}
  value={revenueType}
  onChange={setRevenueType}
  placeholder="เลือกประเภท"
  searchPlaceholder="ค้นหา..."
/>
```

- The `revenueType` / `setRevenueType` state hooks are unchanged.
- Import `SearchableSelect` at the top of `project-detail-client.tsx`.

---

## Fix 2 — Overage Validation with Red Border

### Context

`project.budget` is a nullable `Float` field in the DB. The remaining budget is already computed client-side:

```ts
const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0)
const remainingBudget = (project.budget ?? 0) - totalRevenue
```

The three budget summary cards (มูลค่าโปรเจค / รับเงินแล้ว / คงเหลือ) are only rendered when `project.budget != null`.

### Design

**Validation logic (computed inline, no new state needed):**

```ts
const enteredAmount = parseFloat(revenueAmount) || 0
const isOverBudget =
  project.budget != null &&
  enteredAmount > 0 &&
  enteredAmount > remainingBudget
```

**Amount input — conditional border classes:**

Only the `border-*` and `focus:ring-*` portions change. Preserve existing `px-4 py-2.5 rounded-xl` and other classes from the source:

```tsx
className={`w-full px-4 py-2.5 rounded-xl border text-sm ... ${
  isOverBudget
    ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500"
    : "border-gray-200 focus:ring-purple-500"
}`}
```

**Error message — shown below the input when `isOverBudget`:**

```tsx
{isOverBudget && (
  <p className="text-xs text-red-500 mt-1">
    เกินมูลค่าคงเหลือ (฿{remainingBudget.toLocaleString("th-TH")})
  </p>
)}
```

**บันทึก button — extend the existing `disabled` condition:**

```tsx
// Before:
disabled={revenueSaving || !revenueAmount || parseFloat(revenueAmount) <= 0}

// After:
disabled={revenueSaving || !revenueAmount || parseFloat(revenueAmount) <= 0 || isOverBudget}
```

**Edge cases:**
- `project.budget === null` → `isOverBudget` is always `false`; no validation shown (consistent with the budget section not being visible)
- `remainingBudget <= 0` (fully paid) → any positive amount triggers the error
- Empty field or `0` → existing validation handles this; `isOverBudget` is `false` (guarded by `enteredAmount > 0`)

---

## Files Modified

| File | Change |
|---|---|
| `components/project-detail-client.tsx` | Replace native `<select>` with `SearchableSelect`; add `isOverBudget` computed value; update amount input classes + error message; extend button disabled condition |

## Files Not Modified

| File | Reason |
|---|---|
| `components/ui/searchable-select.tsx` | Drop-in as-is, no changes needed |
| Any API route | Pure UI/validation change; no server-side logic involved |
| Prisma schema | No data model changes |

---

## Non-Goals

- Making category options dynamic (DB-driven) — out of scope
- Adding server-side validation for overage — the budget field is nullable and advisory; client-side guard is sufficient
- Surfacing the `isConfirmed` Revenue field — out of scope
