# Smart Task Generator — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Authors:** Philipp + Bob

## Overview

Replace the naive "generate all tasks at start of KW window" logic with an intelligent task generator that distributes sowing tasks across their windows, factors in weather conditions, and prioritizes by urgency and conditions.

## Problem

The current `generateWeeklyTasks` Cloud Function creates a task for every variety whose KW window includes the current week. This produces 37 tasks in KW 13, overwhelming the user. Tasks don't consider weather, frost sensitivity, or timing within the window.

## Design

### Ideal KW Calculation

Each variety gets an `idealKW` — the best week to suggest the task within its window `[startKW, endKW]`.

**Rules by type:**

| Condition | Ideal KW | Rationale |
|-----------|----------|-----------|
| Frost-sensitive + outdoor direct sow | Late third of window, never before KW 20 | Avoid frost risk |
| Frost-sensitive + indoor sow | Middle of window | Indoor = safe, but don't start too early |
| Frost-tolerant (peas, carrots, radishes, spinach, etc.) | Early third of window | Can go out early, benefit from early start |
| Succession sowing | First sow in early third, then repeat every `successionIntervalWeeks` | Staggered harvests |
| Transplanting | Middle of window, never before KW 18 for frost-sensitive | Hardening off needs time |

**Calculation:**

```
windowLength = endKW - startKW
earlyThird = startKW + floor(windowLength / 3)
middle = startKW + floor(windowLength / 2)
lateThird = startKW + floor(windowLength * 2 / 3)
```

For frost-sensitive outdoor: `idealKW = max(lateThird, 20)`
For frost-sensitive indoor: `idealKW = middle`
For frost-tolerant: `idealKW = earlyThird`
For succession: first `idealKW` as above, then `idealKW + interval`, `idealKW + 2*interval`, etc. while still within window.

### Weather Integration

The `checkWeather` function already runs every 6 hours and stores forecast data. The task generator uses this data.

**Blocking (outdoor direct sow only):**
- If min temperature < `frostThresholdC` (default 3°C) in the next 5 days → block outdoor direct sow tasks
- Blocked tasks get `status: 'weather_blocked'` and `blockedReason: 'Frost erwartet (X°C)'`
- Blocked tasks are re-evaluated next week automatically
- Indoor sowing and transplanting (to greenhouse) are never weather-blocked

**Recommending:**
- If temp is 8-18°C and light rain (1-5mm) expected in next 3 days → mark outdoor sow tasks as `weatherBoost: true`
- Display as "Wetter perfekt für Aussaat" badge

### Task Priority

Each generated task gets a `priority` field:

| Priority | Condition | Display |
|----------|-----------|---------|
| `high` | Last 2 KWs of the window (time running out) | Badge: "Zeitkritisch" |
| `high` | Weather boost active | Badge: "Wetter perfekt" |
| `normal` | Current KW matches idealKW | Badge: "Ideal diese Woche" |
| `low` | Window is open but idealKW hasn't arrived yet | Badge: "Optional — Fenster offen" |
| `blocked` | Weather-blocked | Badge: "Wegen Frost verschoben" |

### Data Model Changes

**tasks/** — add fields:
- `priority`: "high" | "normal" | "low" | "blocked"
- `priorityReason`: string — human-readable reason for badge display
- `weatherBlocked`: boolean — whether weather prevented this task
- `blockedReason`: string | null — e.g. "Frost erwartet (2°C)"

**varieties/** — no changes needed. The `frostSensitive` field and KW ranges already contain all the info needed.

### Updated Cloud Function: `generateWeeklyTasks`

Runs Monday 06:00. New logic:

1. Get current KW
2. Fetch latest weather data from `weather/current`
3. For each variety in the household:
   a. Calculate `idealKW` based on variety type and frost sensitivity
   b. Determine which sowing windows include the current KW
   c. For each applicable action (sow indoor, sow direct, transplant):
      - Skip if task already exists for this variety + KW + year
      - Calculate priority based on idealKW vs currentKW vs window end
      - If outdoor direct sow + frost in forecast → set as blocked
      - If outdoor + ideal weather → set weatherBoost
      - Create task with priority and reason
4. For succession varieties: also generate follow-up tasks at `idealKW + interval` etc.

### UI Changes

**Aufgaben page:**
- Sort by priority: high → normal → low → blocked
- Show priority badge next to each task
- Blocked tasks shown in a separate "Verschoben" section at the bottom, grayed out
- Color coding: high = amber/red border, normal = green, low = no border, blocked = gray with frost icon

**Dashboard:**
- "Diese Woche" section shows only high + normal priority tasks
- Count shows "X wichtige Aufgaben" instead of total count

### What This Does NOT Do

- No automatic rescheduling to a specific future date — blocked tasks just wait for next week's evaluation
- No soil temperature integration — uses air temperature as proxy
- No moon phase planting — stick to KW-based scheduling
- No per-user task capacity limits — priorities handle this naturally

## Files Changed

- `functions/generateWeeklyTasks.js` — complete rewrite of task generation logic
- `src/pages/Aufgaben.jsx` — priority sorting, badges, blocked section
- `src/pages/Dashboard.jsx` — filter by priority, updated count
- `src/components/TaskItem.jsx` — priority badge display
