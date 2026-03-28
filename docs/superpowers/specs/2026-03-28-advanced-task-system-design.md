# Advanced Task System — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Builds on:** Smart Task Generator (2026-03-28)

## Overview

Expand the Dacha App from sowing-only task generation to a comprehensive garden task system with 77 maintenance task templates, weather-triggered activation, recurring schedules, and category-grouped UI.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Task list integration | Merged, visually grouped by category | One list with category headers — keeps attention in one place while providing structure |
| Weather integration | Progressive — frost + trocken + >25°C now, extensible model for all 13 conditions later | Covers 80% of use cases, data model supports future expansion |
| Recurrence | Template + instance model | Templates define rules, cloud function generates concrete instances on schedule |
| Preconditions | Text display only, no automation | Precondition text shown on task card, user decides if it applies |
| Task capacity | No limit | Small garden, two people — priority sorting and category grouping is enough |
| Template storage | Firestore collection, seeded from Excel | Consistent with varieties pattern, editable without redeploy |
| Task assignment | Shared list, no per-person assignment | Both users pull from the same list |

## Data Model

### New Collection: `taskTemplates/`

Seeded from `docs/garten_tasks_dacha.xlsx` (77 records across 14 categories).

```
taskTemplates/{templateId}
├── id: string                    // From Excel ID column
├── kategorie: string             // e.g. "Saisonstart", "Bewässerung", "Kompost"
├── unterkategorie: string        // e.g. "Beete vorbereiten", "Gießen"
├── title: string                 // e.g. "Beete von Mulch/Winterabdeckung befreien"
├── description: string           // Detailed description from Excel
├── kwStart: number               // Start of active KW window
├── kwEnd: number                 // End of active KW window
├── priority: "hoch" | "mittel" | "niedrig"
├── weatherCondition: string|null // "frostfrei" | "trocken" | ">25°C" | null
├── temperatureCondition: string|null  // Human-readable text, displayed only
├── precondition: string|null     // Human-readable text, displayed only
├── recurrence: string            // "einmalig" | "wöchentlich" | "täglich" | "alle_2_wochen" | "täglich_bei_hitze" | "bei_bedarf"
├── durationMinutes: number|null  // Estimated duration from Excel
├── notes: string|null
├── householdId: string
└── active: boolean               // Soft disable toggle
```

### Expanded: `tasks/` (existing collection)

All existing fields preserved. New fields added:

```
tasks/{taskId}
├── ... (all existing fields: title, type, dueKW, dueYear, priority, priorityReason, weatherBlocked, blockedReason, completed, completedDate, completedBy, householdId)
├── templateId: string|null       // NEW — reference to taskTemplate (null for sowing tasks)
├── kategorie: string|null        // NEW — for UI grouping (null for legacy sowing tasks)
├── type: "maintenance"|"sow"|"transplant"  // EXPANDED — new "maintenance" value
```

Legacy sowing tasks (templateId=null, kategorie=null) continue to work unchanged. They display under an "Aussaat & Pflanzung" group in the UI.

**Removed:** `assignedTo` field is no longer used. Existing tasks with assignedTo are ignored — shared list model.

### Firestore Rules

Add `taskTemplates` collection with the same household-scoped pattern:

```
match /taskTemplates/{templateId} {
  allow read: if isHouseholdMember(resource.data.householdId);
  allow write: if isHouseholdMember(request.resource.data.householdId);
}
```

## Task Generation Logic

### Existing: `generateWeeklyTasks` Cloud Function

Runs every Monday at 06:00 Europe/Berlin (unchanged schedule).

**Step 1 — Sowing tasks (unchanged):**
Same logic as today. Check varieties against current KW, create sow/transplant task instances.

**Step 2 — Template-based tasks (NEW):**

Fetch all active `taskTemplates` for the household where current KW is in `[kwStart, kwEnd]`.

For each matching template, apply recurrence logic:

| Recurrence | Behavior |
|------------|----------|
| `einmalig` | Create one task per year. Skip if task with this templateId + year already exists. |
| `wöchentlich` | Create one task per KW. Skip if task with this templateId + KW + year exists. |
| `alle_2_wochen` | Create one task every 2 KWs. Skip if task with this templateId was created in the last 2 KWs. |
| `täglich` | Handled by daily function (see below). |
| `täglich_bei_hitze` | Handled by daily function, only when >25°C. |
| `bei_bedarf` | Never auto-generated. Available in template browser for manual creation. |

**Step 3 — Weather check (expanded):**

For each newly created task with a `weatherCondition`:

| Condition | Check | Effect |
|-----------|-------|--------|
| `frostfrei` | min temp <= 0°C in next 3 days | Set `weatherBlocked=true`, priority="blocked" |
| `trocken` | rain > 2mm in next 24h | Set `weatherBlocked=true`, priority="blocked" |
| `>25°C` | max temp <= 25°C | Don't generate the task at all (not blocked, just not applicable) |

**Priority mapping:**

| Excel Priority | KW Position | Result |
|----------------|-------------|--------|
| Hoch | Last 2 KWs of window | `high` — "Zeitkritisch" |
| Hoch | Other | `normal` — "Diese Woche" |
| Mittel | Any | `normal` — "Diese Woche" |
| Niedrig | Any | `low` — "Optional" |
| Any | Weather blocked | `blocked` — overrides all |

### New: `generateDailyTasks` Cloud Function

Runs daily at 06:00 Europe/Berlin. Lightweight — only handles daily recurrence templates.

- Fetch templates with recurrence `täglich` or `täglich_bei_hitze` where current KW is in window
- For `täglich`: create task if none exists for today
- For `täglich_bei_hitze`: create task only if today's forecast max temp > 25°C
- Apply same weather blocking logic as weekly function

### Deduplication

All task creation checks for existing tasks with the same `templateId` + time window (year for einmalig, KW for wöchentlich, date for täglich). This prevents duplicates on function retries or manual triggers.

## Frontend Changes

### Aufgaben Page (`src/pages/Aufgaben.jsx`)

**Layout change:** Tasks grouped by `kategorie` with section headers.

```
[Category filter chips: All | Aussaat | Saisonstart | Bewässerung | ...]

Aussaat & Pflanzung          (sowing/transplant tasks, existing)
├── Tomaten vorziehen         high  🟡
├── Salat direkt säen         normal 🟢
└── Basilikum auspflanzen     low   ⚪

Saisonstart                   (from templates)
├── Beete auflockern          normal 🟢
└── Kompost ausbringen        low   ⚪

Bewässerung
└── Gießplan starten          normal 🟢

── Verschoben ──              (collapsed, blocked tasks)
├── Wasserleitung in Betrieb  blocked ❄️
└── Mulchen                   blocked ❄️

[+ Weitere Aufgaben]          (bei_bedarf browser link)
```

**Category filter chips:** Horizontal scrollable row at top. Tap to toggle categories on/off. "All" selected by default.

**Within each category group:** Tasks sorted by priority (high > normal > low).

**Blocked section:** Stays at bottom, collapsed by default (existing pattern).

### Task Card (`src/components/TaskItem.jsx`)

Expanded to show:
- Title + priority badge (existing)
- Duration badge if set (e.g. "~30 Min")
- Precondition text below title in small gray text (if set)
- Checkbox to complete (existing)

### "Bei Bedarf" Template Browser

- Accessible via "+ Weitere Aufgaben" link at bottom of Aufgaben page
- Shows all templates with recurrence="bei_bedarf" where current KW is in window
- Each template shows: title, description, kategorie, duration
- Tap to create a task instance from the template

### No Changes To

- Dashboard (still shows task count + weather widget)
- Wetter page
- Saatgut / Beete pages
- Bottom navigation
- ErnteLog page

## Seeding

### New Script: `scripts/seed-task-templates.js`

- Parses `docs/garten_tasks_dacha.xlsx` (all 3 sheets)
- Maps each row from Sheet 1 (Garten-Tasks) to a `taskTemplate` document
- Maps weather condition strings from Sheet 2 (Wetter-Logik) to enum values
- Maps recurrence pattern strings from Sheet 3 (Wiederholungs-Logik) to enum values
- Seeds to Firestore `taskTemplates/` collection with householdId
- Idempotent — can re-run without creating duplicates (uses Excel ID as document ID)

### Dependencies

- `xlsx` npm package for Excel parsing (add to functions or scripts)

## Migration & Compatibility

- **Additive only** — no destructive changes to existing data
- Existing `tasks/` documents without `templateId` or `kategorie` continue to work
- `TaskItem.jsx` handles both formats (legacy sowing tasks show under "Aussaat & Pflanzung")
- `assignedTo` field ignored in UI going forward (not deleted from existing docs)
- Cloud Functions deploy is backward-compatible — old tasks unaffected

## File Changes Summary

| File | Change |
|------|--------|
| `functions/generateWeeklyTasks.js` | Add template-based task generation + expanded weather checks |
| `functions/generateDailyTasks.js` | NEW — daily recurrence handler |
| `functions/index.js` | Export new daily function |
| `src/pages/Aufgaben.jsx` | Category grouping, filter chips, bei_bedarf link |
| `src/components/TaskItem.jsx` | Duration badge, precondition text |
| `src/utils/formatters.js` | Add kategorie labels |
| `scripts/seed-task-templates.js` | NEW — Excel parser + Firestore seeder |
| `firestore.rules` | Add taskTemplates collection rules |
| `firebase.json` | Add daily function schedule |
