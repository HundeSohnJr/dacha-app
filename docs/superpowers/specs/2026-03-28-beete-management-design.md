# Beete Management Redesign — Design Spec

**Date:** 2026-03-28
**Status:** Approved

## Overview

Rewrite the Beete (garden beds) feature from read-only display to full planting management. Fix the garden layout to match the real plot, add CRUD for plantings, support multiple plantings per bed (Mischkultur), and show companion planting warnings.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Planting entry | Both directions (from bed + from variety) | Sometimes staring at bed, sometimes at seed packet |
| Bed layout within a bed | Simple list, no rows/zones | Phone-friendly, less friction, notes field for spatial detail |
| Planting statuses | 3: geplant, aktiv, fertig | Fine-grained statuses add friction without value for small garden |
| Companion warnings | Soft — yellow hint, can proceed | Data already exists, cheap to build, actually useful |
| Moving plantings | Edit form with bed picker | Detail sheet for all edits, drag-and-drop terrible on mobile |
| Crop rotation | Not now, data collected for later | Need multi-year data first, current schema supports it |
| Variety picker | Searchable with category filter | 109 varieties is too many to scroll |

## Data Model

### Plantings (existing collection, no schema change)

```
plantings/{plantingId}
├── varietyId: string         // Reference to varieties/{id}
├── bedId: string             // Reference to beds/{id}
├── year: number              // e.g. 2026
├── status: string            // "geplant" | "aktiv" | "fertig"
├── sownDate: timestamp|null
├── transplantDate: timestamp|null
├── firstHarvestDate: timestamp|null
├── notes: string|null
├── householdId: string
```

**Status migration (render-time, no script):**
- "planned" -> displays as "geplant"
- "seedling", "transplanted", "growing", "harvesting" -> displays as "aktiv"
- "done" -> displays as "fertig"

New plantings use the new status values directly.

### Beds and Varieties: No changes.

## Garden Layout (Beete Overview)

The grid must match the real 12.5 x 24m plot. Two main columns separated by a path.

**Left column (west side, below Haus):**
- Haus (large block, upper area)
- HB1 + HB2: upside-down L shape (HB2 on top, HB1 narrow below-left)
- HB3 + HB4: mirrored L shape (HB4 on top, HB3 wider below)

**Right column (east side, bottom to top):**
- Thuja marker (southernmost point, casts shade)
- HB5 + HB6: in a line, side by side (shade from Thuja)
- HB8 + HB9: upside-down L shape
- HB7 + HB10: mirrored L shape (right of 8+9)
- HB11 + HB12: in a line, side by side
- KB13, KB14, KB15: three small beds in a row
- Erdfläche (8m²)
- Gewächshaus (12m², northernmost)

**Sun from south (bottom of screen).**

Each bed card shows:
- Bed name + sun exposure icon
- Planting preview: first 2-3 variety names, "+N more" if more
- Green background if has active plantings, gray if empty
- Tap navigates to BedDetail

## UX Flows

### Flow 1: Add Planting from BedDetail

1. User taps "+" button on BedDetail page
2. AddPlantingSheet opens (bottom sheet modal)
3. VarietyPicker at top: search input + category filter chips
4. User picks a variety
5. Companion check runs:
   - Get all active plantings in this bed
   - Check picked variety's `incompatible` array against planted varieties
   - If conflict: show yellow warning banner (e.g. "Achtung: Dill ist unverträglich mit Möhren")
   - User can still proceed
6. Status selector: "geplant" or "aktiv" (default: "aktiv")
7. Optional notes text field
8. Save button -> creates planting document in Firestore
9. Sheet closes, planting appears in bed list (real-time via onSnapshot)

### Flow 2: Add Planting from VarietyDetail

1. User taps "Einpflanzen" button on VarietyDetail page
2. Bed picker opens: grid of 17 beds (matching garden layout), each showing name + active planting count
3. User taps a bed
4. Same companion check + status selector + notes as Flow 1
5. Save -> navigate to BedDetail for that bed

### Flow 3: Edit/Move/Delete Planting

1. User taps a planting in BedDetail's list
2. EditPlantingSheet opens (bottom sheet):
   - Variety name (read-only, displayed as header)
   - Bed picker (dropdown of 17 beds, current bed pre-selected)
   - Status picker: geplant / aktiv / fertig
   - Notes text field
   - Delete button (red, at bottom, with confirmation)
3. Changing bed = moving the planting (updates `bedId`)
4. Setting status to "fertig" = marks as done (moves to history section)
5. Delete = removes planting document entirely (with "Wirklich löschen?" confirmation)
6. Save -> updates Firestore document

## Components

### New Components

**VarietyPicker** (`src/components/VarietyPicker.jsx`)
- Search input (filters by variety name, case-insensitive)
- Category filter chips (horizontal scroll, same pattern as Aufgaben)
- Scrollable list of matching varieties
- Each row: variety name + category label
- Tap to select, calls `onSelect(variety)` callback
- Reusable (used by AddPlantingSheet and VarietyDetail flow)

**AddPlantingSheet** (`src/components/AddPlantingSheet.jsx`)
- Bottom sheet modal (same pattern as TemplateBrowser)
- Contains VarietyPicker
- After variety selected: shows companion warning (if any), status picker, notes field
- Save button creates planting in Firestore

**EditPlantingSheet** (`src/components/EditPlantingSheet.jsx`)
- Bottom sheet modal
- Variety name as header (read-only)
- Bed dropdown (select from 17 beds)
- Status radio buttons: geplant / aktiv / fertig
- Notes textarea
- Save button updates planting
- Delete button with confirmation

**PlantingCard** (`src/components/PlantingCard.jsx`)
- Row component for each planting in BedDetail
- Shows: variety name, status badge (colored), notes preview
- Tap opens EditPlantingSheet

### Modified Components

**BedCard** (`src/components/BedCard.jsx`)
- Add planting name preview (first 2-3 names + "+N more")

**Beete** (`src/pages/Beete.jsx`)
- Complete grid rewrite to match real garden layout with L-shaped bed pairs

**BedDetail** (`src/pages/BedDetail.jsx`)
- Full rewrite: planting list with PlantingCards, "+" button, history section

**VarietyDetail** (`src/pages/VarietyDetail.jsx`)
- Add "Einpflanzen" button that opens bed picker + planting flow

## Companion Planting Check

When adding a planting to a bed:

```
1. Get all active plantings in the target bed
2. For each active planting, look up its variety
3. Check if the new variety's name appears in any existing variety's `incompatible` array
4. Check if any existing variety's name appears in the new variety's `incompatible` array
5. If any match: show yellow warning with specific conflict
6. User can still save (soft warning only)
```

Warning format: "Achtung: [New Variety] ist unverträglich mit [Existing Variety]"

## Status Display Mapping

For rendering, map old and new statuses to display values:

| Stored Value | Display Label | Badge Color |
|-------------|---------------|-------------|
| "planned", "geplant" | Geplant | blue-100/blue-700 |
| "seedling", "transplanted", "growing", "harvesting", "aktiv" | Aktiv | green-100/green-700 |
| "done", "fertig" | Fertig | slate-100/slate-500 |

New plantings always use: "geplant", "aktiv", "fertig".

## File Changes Summary

| File | Change |
|------|--------|
| `src/pages/Beete.jsx` | Complete rewrite — new grid matching real garden layout |
| `src/pages/BedDetail.jsx` | Full rewrite — planting management with add/edit/history |
| `src/pages/VarietyDetail.jsx` | Add "Einpflanzen" button + bed picker flow |
| `src/components/BedCard.jsx` | Add planting name preview |
| `src/components/VarietyPicker.jsx` | NEW — searchable variety list with category filter |
| `src/components/AddPlantingSheet.jsx` | NEW — add planting bottom sheet with companion check |
| `src/components/EditPlantingSheet.jsx` | NEW — edit/move/delete planting bottom sheet |
| `src/components/PlantingCard.jsx` | NEW — planting row component |

**No backend changes. Pure frontend feature.**
