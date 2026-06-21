# Work Types, Payment-on-Work-Order, and Photo Markup — Design

Date: 2026-06-21
App: `field-service-app` (offline-first PWA; Vite + React + Dexie + jsPDF)
Live: https://stayfrosty84.github.io/field-service-app/

## Context

Three additive features for the field-service operator. They build on the existing
work-order → bill-of-sale flow, the parts/labor catalog, the `useFeatures` toggles, and the
inline-SVG `Icon` component (`src/components/Icon.jsx`). New UI uses `Icon`, not emoji.

**Out of scope (explicitly dropped by the user):** Estimates / Quotes. Do not build a quotes
flow or a quote→bill conversion.

## Feature 1 — Work types with line-item templates

A work type (e.g. "Tire Job") carries a template of line items. Selecting it on a new work
order pre-fills the bill's line items, so common jobs don't get retyped.

- **Data:** new Dexie store `workTypes` (schema `version(3)`):
  `{ id, name, icon, items: [{ description, qty, unitPrice }], createdAt }`.
  `items` is a plain (non-indexed) array.
- **Seeding:** on app boot, if `businessProfile.workTypesSeeded` is not set, insert starter
  types then set the flag (so deleting them all does not re-seed). Starters (all editable):
  - **Service Call** — `Service call / trip fee` ×1 @ 65
  - **Diagnostic** — `Diagnostic fee` ×1 @ 95
  - **Tire Job** — `Tire mount & balance` ×4 @ 25; `Shop supplies` ×1 @ 10
- **DB helpers:** `listWorkTypes`, `createWorkType`, `updateWorkType`, `deleteWorkType`,
  `ensureSeedWorkTypes` (idempotent, guarded by the profile flag). Call `ensureSeedWorkTypes`
  once from `main.jsx` on boot.
- **Settings — Work types manager** (`WorkTypeManager.jsx`, same shape as `CatalogManager`):
  add / rename / delete a type and edit its template line items (description, qty, unit price).
  Optional icon defaults to `wrench`.
- **New Work Order** (`WorkOrderNew.jsx`): a "Work type" row of selectable chip buttons +
  a "None" option. Selecting one sets `workTypeId` in form state. On save, persist
  `workTypeId` **and a snapshot** `templateItems` (copied from the type's `items`) onto the
  work order. Snapshotting means later edits to a template never rewrite past work orders.
- **Work Order detail** (`WorkOrderDetail.jsx`): show the selected work type as chips and allow
  changing it; changing updates `workTypeId` + `templateItems` on the order. (Only affects bills
  created afterward.)
- **Bill editor** (`BillEditor.jsx`): in the init effect's no-existing-bill branch
  (`src/pages/BillEditor.jsx` ~L62–65), if `order.templateItems?.length`, seed `items` from them
  (mapped to `{ id: uuid, description, qty, unitPrice }`) instead of a single blank row.
  Everything downstream (catalog add, tax, card fee, review, signature, PDF) is unchanged.

## Feature 2 — Payment on the work order; remove the Billing tab

Payment status already lives on the bill record (`paymentStatus`, `paymentMethod`, `paidAt`,
with `markBillPaid` / `markBillUnpaid` helpers). Move the surfacing of it onto the work order
and retire the dedicated tab.

- **Remove** the Billing tab from `Layout.jsx` `ALL_TABS`, the `/billing` route + `Billing`
  import in `App.jsx`, and delete `src/pages/Billing.jsx`.
- **Settings toggle rename:** "Billing tab & payment tracking" → **"Payment tracking"**, hint
  "Track Paid/Unpaid on bills and work orders." Keep the internal key `featBilling` (no
  migration); it now only gates payment UI. `useFeatures().billing` stays the gate.
- **Work Order detail — Bill section:** when a bill exists, add **Mark paid / Mark unpaid**.
  Marking paid shows a quick method pick (Cash / Check / Card / Other) and calls
  `markBillPaid(billId, method)`; unpaid calls `markBillUnpaid(billId)`. Works regardless of the
  order's open/completed status. Gated by `features.billing`.
- **Work list** (`Work.jsx`): load bills (map by `workOrderId`). Rows whose order has a bill
  show a paid/unpaid badge and a quick "Mark paid" action (a button inside the row Link that
  calls `e.preventDefault()` + `e.stopPropagation()` then `markBillPaid`). Add an **"Unpaid"**
  filter chip (orders that have a bill with `paymentStatus !== 'paid'`). Payment UI gated by
  `features.billing`.
- **Dashboard** (`Home.jsx`): the "Unpaid" / Outstanding action navigates to
  `/work` with router state `{ filter: 'unpaid' }` (no longer `/billing`). `Work.jsx` initializes
  its filter from `location.state?.filter`.
- **Assumption (stated to user):** Mark-paid appears only once a work order has a bill, because
  paid/unpaid is stored on the bill and needs an amount to feed reports. No paid-without-a-bill.

## Feature 3 — Photo markup (red box / arrow / circle)

A lightweight annotator to circle/point at problems in job photos. No new dependency.

- **Component** `PhotoMarkup.jsx` — full-screen overlay editor. Props `{ blob, onSave, onClose }`.
  - One `<canvas>` sized to the image's natural dimensions (longest side capped ~1600px for
    memory), displayed scaled-to-fit via CSS. Pointer coords mapped to canvas space via the
    bounding rect + scale factor.
  - State: `shapes[]` (committed) + a live draft during drag. Each shape:
    `{ tool: 'box'|'circle'|'arrow', x0, y0, x1, y1 }`. Color fixed red (`#ef4444`); stroke width
    `max(3, longestSide / 250)`.
  - Render loop: clear → `drawImage` → draw each shape. Box = `strokeRect`; circle =
    `ctx.ellipse`; arrow = line + two-segment arrowhead at the tip.
  - Toolbar (Icon buttons): box (`square`), circle (`circle`), arrow (`arrow-up-right`),
    Undo (`rotate-ccw`, pops last shape), Clear (`trash-2`), Cancel (`x`), Save (`check`).
  - **Save** flattens to a blob via `canvas.toBlob('image/jpeg', 0.9)` and calls `onSave(blob)`.
- **Persistence (replace):** new DB helper `updatePhoto(id, blob)` →
  `db.photos.update(id, { blob, annotatedAt: now() })`. The annotated image replaces the
  original; it then flows into the bill PDF exactly as photos do today.
- **Entry point:** on `WorkOrderDetail.jsx`, tapping a photo thumbnail opens the markup editor
  (the existing ✕ remove control stays). Markup applies to saved photos on the detail screen;
  photos shot on the new-WO form are annotated after saving (which lands on the detail screen).
- **Icons to add** to `Icon.jsx` (Lucide-style, additive): `square`, `circle`, `arrow-up-right`,
  `trash-2`.

## Data model / migration

- Dexie `version(3)` adds the `workTypes` store; all existing stores carry forward untouched.
- New work-order fields `workTypeId` and `templateItems` are non-indexed — no migration needed.
- Photo markup updates the existing row's `blob` in place (no schema change).
- `businessProfile.workTypesSeeded` (boolean) gates one-time seeding.
- **Backup** (`src/lib/backup.js`): add `workTypes` to the `TABLES` list so types are included in
  backup/restore. (Photo blobs are already handled.)

## Testing (extend the Playwright smoke test in `/tmp/fs-smoke/smoke.mjs`)

- **Work types:** assert starter types exist; on a new work order pick a work type → open the
  bill editor and assert the template line items are pre-filled.
- **Payment:** assert there is no Billing tab in the nav. Mark a bill paid from the Work Order
  detail and from the Work list; verify `paymentStatus: 'paid'` via the backup JSON.
- **Photo markup:** open the editor on a photo, draw via dispatched pointer events (as the
  signature test does), save, and assert the photo blob changed and the bill PDF still generates
  with zero console errors.
- Keep jsPDF in its lazy chunk; run `npm run build` after each feature.

## Build order (each shippable on its own)

1. Payment-on-WO + remove Billing tab (smallest, self-contained).
2. Work types (DB + seed → Settings manager → new-WO chips → bill prefill).
3. Photo markup (Icon additions → editor → detail entry point → DB helper).

Deploy (commit → push `main` → GitHub Actions) only when the user asks.
