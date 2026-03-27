# Dacha App — Design Spec

**Date:** 2026-03-27
**Status:** Draft
**Authors:** Philipp + Bob

## Overview

Dacha App is a PWA for managing a 56m² allotment garden in Bürstadt, Germany. It serves as a smart garden dashboard for a two-person household (Philipp and Nastia), providing sowing calendar automation, weather intelligence with frost alerts, bed management, harvest tracking, and task coordination — all driven by a rich seed library of 106+ varieties.

## Users

- **Philipp** — primary gardener, manages planning and execution
- **Nastia** — co-gardener, shares tasks and harvest logging
- No public registration. Household members only, added by invite.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| PWA | vite-plugin-pwa (service worker, installable, offline-capable) |
| Backend | Firebase Cloud Functions (Node.js) |
| Database | Firebase Firestore |
| Auth | Firebase Auth (Google sign-in) |
| Push | Firebase Cloud Messaging (FCM) |
| Weather | Open-Meteo API (free, no key, excellent European coverage) |
| Hosting | Vercel (frontend), Firebase (functions + DB) |
| Cost | 0 EUR/month within free tiers |

## Data Model (Firestore)

### Collections

**varieties/** — Seed library (106 initial, user-editable)
- `name`: string — variety name
- `category`: string — tomato, cucumber, herb, flower, etc.
- `sowIndoorsKW`: [number, number] — KW range for indoor sowing
- `sowDirectKW`: [number, number] — KW range for direct sowing
- `transplantKW`: [number, number] — KW range for transplanting
- `harvestKW`: [number, number] — KW range for harvest
- `sunRequirement`: "full" | "partial" | "shade"
- `frostSensitive`: boolean
- `companions`: string[] — companion plant names
- `incompatible`: string[] — incompatible plant names
- `succession`: boolean — whether to succession sow
- `successionIntervalWeeks`: number | null
- `selfSeeding`: boolean
- `notes`: string

**beds/** — Garden layout
- `name`: string — e.g. "HB1", "Greenhouse", "KB13"
- `type`: "raised" | "ground" | "greenhouse" | "small"
- `dimensions`: { length: number, width: number } — in cm
- `sunExposure`: "full" | "partial" | "shade"
- `notes`: string

**plantings/** — What's planted where and when (the core link)
- `varietyId`: reference → varieties/
- `bedId`: reference → beds/
- `year`: number
- `status`: "planned" | "seedling" | "transplanted" | "growing" | "harvesting" | "done"
- `sownDate`: timestamp | null
- `transplantDate`: timestamp | null
- `firstHarvestDate`: timestamp | null
- `notes`: string

**harvests/** — Yield tracking
- `plantingId`: reference → plantings/
- `date`: timestamp
- `quantity`: number
- `unit`: "kg" | "stück" | "bund"
- `quality`: "great" | "good" | "poor"

**tasks/** — Auto-generated and manual todo items
- `title`: string
- `type`: "sow" | "transplant" | "harvest" | "water" | "cover" | "custom"
- `dueKW`: number
- `dueYear`: number
- `plantingId`: reference → plantings/ (optional)
- `assignedTo`: "philipp" | "nastia" | null
- `completed`: boolean
- `completedDate`: timestamp | null
- `completedBy`: string | null

**weather/current** — Single document, updated by Cloud Function
- `temperature`: number
- `minTemp`: number
- `maxTemp`: number
- `precipitation`: number
- `forecast`: array of daily forecasts (7 days)
- `frostRisk`: boolean
- `lastUpdated`: timestamp

**alerts/** — Notification log (prevents duplicate alerts)
- `type`: "frost" | "eisheilige" | "rain_skip" | "weekly_tasks"
- `sentAt`: timestamp
- `message`: string

**households/** — Links users to shared data
- `members`: string[] — Firebase Auth UIDs
- `gardenName`: string
- `location`: { lat: number, lng: number } — for weather API
- `frostThresholdC`: number — default 3

## App Screens

### Bottom Navigation (5 tabs)

**1. Dashboard (Home)**
- Frost/weather alerts banner (if applicable)
- Current KW indicator with open task count
- Weather summary (temp, conditions, rain forecast)
- Harvest-ready crops
- Quick actions: complete a task, log a harvest

**2. Beete (Bed Map)**
- Visual garden layout matching the physical plot
- Beds color-coded by status: planted (green), empty (gray), succession-ready (amber)
- Tap a bed → detail view: current plantings, planting history, upcoming tasks, sun exposure
- Greenhouse as separate section
- Sun exposure indicator per bed

**3. Aufgaben (Tasks)**
- This week's tasks, auto-generated from sowing calendar
- Filter by: mine / Nastia's / all
- Swipe to complete
- Overdue tasks highlighted in red
- Add custom tasks manually
- Grouped by type: Aussaat, Pikieren, Auspflanzen, Ernten, Sonstiges

**4. Wetter (Weather)**
- Current conditions from Open-Meteo
- 7-day forecast with temperature chart
- Frost risk indicator with 3°C threshold line
- Rain forecast with watering recommendation
- Eisheilige countdown (until May 15)
- Moon phase display

**5. Saatgut (Seed Library)**
- All varieties, searchable and filterable
- Filter by: category, sowing window, sun requirement, "sow now"
- Variety detail: full schedule, companion info, planting history
- Add/edit/remove varieties
- "Sow now" badge on varieties in their current KW window
- Shopping list section for items still needed

### Additional Screens (via header/settings)

- **Ernte-Log** — harvest history, yield stats, variety comparison charts
- **Einstellungen** — profile, notification preferences, garden location, frost threshold
- **Foto-Tagebuch** — weekly photo journal per bed (images stored in Firebase Storage)

## Cloud Functions

### checkWeather — Scheduled every 6 hours
1. Fetch 48-hour forecast from Open-Meteo for garden coordinates
2. Check minimum temperature against household frost threshold (default 3°C)
3. Check precipitation forecast
4. Update `weather/current` document in Firestore
5. If frost risk detected → call pushFrostAlert
6. If significant rain expected → store watering skip flag

### pushFrostAlert — Triggered by checkWeather
1. Check `alerts/` collection — skip if frost alert already sent today
2. Build notification: "Frostalarm: X°C heute Nacht erwartet — Jungpflanzen abdecken!"
3. Send FCM push to all household member devices (high priority)
4. Log alert in `alerts/`

### generateWeeklyTasks — Scheduled Monday 06:00
1. Determine current KW
2. Query `varieties/` where current KW falls within any sowing/transplant/harvest window
3. Cross-reference with existing `tasks/` to avoid duplicates
4. Create new task documents with appropriate type and title
5. Send FCM push: "KW X: Y neue Aufgaben im Garten"

### dailyDigest — Scheduled daily 07:00
1. Gather: today's weather, open tasks due this KW, harvest-ready crops
2. Only send if there is actionable content (skip empty days)
3. Send FCM push with morning summary

## Push Notification Triggers

| Trigger | Condition | Priority |
|---------|-----------|----------|
| Frost alert | Min temp < frost threshold in next 48h | High |
| Weekly tasks | Monday morning, new KW | Normal |
| Daily digest | Morning, if actionable items exist | Low |
| Eisheilige countdown | 7 days, 3 days, 1 day before May 15 | Normal |
| Rain skip | Significant rain expected, no watering needed | Low |

Notification content, timing, and triggers are configurable and will be fine-tuned after initial use.

## Authentication & Security

- Firebase Auth with Google sign-in (both users have Google accounts)
- Household model: a `households/` document links two Auth UIDs
- Firestore security rules: only authenticated users whose UID appears in the household's `members` array can read/write that household's data
- All data is scoped to a household ID via a `householdId` field on every document in varieties/, beds/, plantings/, harvests/, tasks/, and alerts/. Firestore rules enforce that queries include the householdId filter matching the user's household.
- No public registration — new members added by existing household member via invite

## Initial Data Seeding

The existing garden data (106 varieties from YAML/markdown, 15 beds, current plantings) is baked into the app as seed data. On first Firebase setup, a seeding script populates Firestore with:
- All 106 varieties with their full scheduling data
- All 15 beds (HB1-12, KB13-15, Greenhouse, Ground bed) with dimensions and sun exposure
- Current 2026 plantings (garlic, Brussels sprouts, kale, peas, etc.)

After seeding, all data is managed through the app UI (add, edit, remove).

## Project Structure

```
dacha-app/
├── src/                          # React SPA
│   ├── components/               # Reusable UI components
│   │   ├── BedCard.jsx
│   │   ├── TaskItem.jsx
│   │   ├── WeatherWidget.jsx
│   │   ├── VarietyCard.jsx
│   │   ├── HarvestForm.jsx
│   │   └── Layout.jsx           # Shell with bottom nav
│   ├── pages/                    # Route pages
│   │   ├── Dashboard.jsx
│   │   ├── Beete.jsx
│   │   ├── BedDetail.jsx
│   │   ├── Aufgaben.jsx
│   │   ├── Wetter.jsx
│   │   ├── Saatgut.jsx
│   │   ├── VarietyDetail.jsx
│   │   ├── ErnteLog.jsx
│   │   ├── FotoTagebuch.jsx
│   │   └── Einstellungen.jsx
│   ├── context/
│   │   ├── AuthContext.jsx       # Firebase Auth state
│   │   └── GardenContext.jsx     # Firestore data hooks
│   ├── services/
│   │   ├── firebase.js           # Firebase config + init
│   │   ├── weather.js            # Open-Meteo client (for live display)
│   │   └── notifications.js     # FCM registration + permission
│   ├── data/
│   │   └── seed-data.js          # 106 varieties + 15 beds as JS objects
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                 # Tailwind imports
├── functions/                    # Firebase Cloud Functions
│   ├── index.js
│   ├── checkWeather.js
│   ├── generateWeeklyTasks.js
│   ├── dailyDigest.js
│   └── pushFrostAlert.js
├── public/
│   ├── icons/                    # PWA icons
│   └── manifest.json
├── scripts/
│   └── seed-firestore.js        # One-time data seeding script
├── firestore.rules
├── firebase.json
├── vite.config.js
├── tailwind.config.js
├── vercel.json
└── package.json
```

## Deployment

- **Frontend:** Vercel (same as SchoolSync), auto-deploy from main branch
- **Cloud Functions:** `firebase deploy --only functions`
- **Firestore rules:** `firebase deploy --only firestore:rules`
- **Initial setup:** Run `scripts/seed-firestore.js` once to populate initial data

## Language

All UI text in German. No internationalization needed.
