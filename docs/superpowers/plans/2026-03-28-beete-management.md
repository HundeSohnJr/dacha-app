# Beete Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Beete feature from read-only to full planting management with accurate garden layout, CRUD operations, and companion planting warnings.

**Architecture:** Pure frontend changes. New bottom-sheet components for add/edit plantings. VarietyPicker reusable component for searchable variety selection. Garden grid rewritten with CSS grid to match the real 12.5x24m plot with L-shaped bed pairs. Status migration handled at render time.

**Tech Stack:** React 19, Tailwind CSS 4, Firestore (addDoc/updateDoc/deleteDoc), lucide-react icons

---

### Task 1: Status Display Helper

**Files:**
- Create: `src/utils/plantingStatus.js`

A small utility to normalize old/new planting statuses to display values. Used by multiple components.

- [ ] **Step 1: Create src/utils/plantingStatus.js**

```javascript
const STATUS_MAP = {
  planned: 'geplant',
  geplant: 'geplant',
  seedling: 'aktiv',
  transplanted: 'aktiv',
  growing: 'aktiv',
  harvesting: 'aktiv',
  aktiv: 'aktiv',
  done: 'fertig',
  fertig: 'fertig',
}

const STATUS_STYLES = {
  geplant: { label: 'Geplant', bg: 'bg-blue-100', text: 'text-blue-700' },
  aktiv: { label: 'Aktiv', bg: 'bg-green-100', text: 'text-green-700' },
  fertig: { label: 'Fertig', bg: 'bg-slate-100', text: 'text-slate-500' },
}

export function normalizeStatus(status) {
  return STATUS_MAP[status] || 'aktiv'
}

export function getStatusStyle(status) {
  return STATUS_STYLES[normalizeStatus(status)] || STATUS_STYLES.aktiv
}

export function isActivePlanting(planting) {
  const s = normalizeStatus(planting.status)
  return s === 'geplant' || s === 'aktiv'
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/plantingStatus.js
git commit -m "feat: add planting status normalization utility"
```

---

### Task 2: VarietyPicker Component

**Files:**
- Create: `src/components/VarietyPicker.jsx`

Searchable, filterable variety list used by both AddPlantingSheet and the VarietyDetail flow.

- [ ] **Step 1: Create src/components/VarietyPicker.jsx**

```jsx
import { useState } from 'react'
import { categoryLabels } from '../utils/formatters'
import { Search } from 'lucide-react'

export default function VarietyPicker({ varieties, onSelect }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = varieties.filter((v) => {
    const matchesSearch = !search || v.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Only show categories that have varieties
  const categories = [...new Set(varieties.map((v) => v.category))].sort()

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sorte suchen..."
          autoFocus
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            categoryFilter === 'all' ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          Alle
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              categoryFilter === cat ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1">
        {filtered.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v)}
            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
          >
            <div className="text-sm font-medium text-slate-800">{v.name}</div>
            <div className="text-xs text-slate-500">{categoryLabels[v.category] || v.category}</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Keine Sorten gefunden</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VarietyPicker.jsx
git commit -m "feat: add searchable VarietyPicker component"
```

---

### Task 3: PlantingCard Component

**Files:**
- Create: `src/components/PlantingCard.jsx`

Row component for displaying a planting in a bed's list. Tappable to open edit sheet.

- [ ] **Step 1: Create src/components/PlantingCard.jsx**

```jsx
import { getStatusStyle } from '../utils/plantingStatus'

export default function PlantingCard({ planting, varietyName, onTap }) {
  const style = getStatusStyle(planting.status)

  return (
    <button
      onClick={() => onTap(planting)}
      className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800">{varietyName}</div>
        {planting.notes && (
          <div className="text-xs text-slate-400 mt-0.5 truncate">{planting.notes}</div>
        )}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} ml-2 flex-shrink-0`}>
        {style.label}
      </span>
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PlantingCard.jsx
git commit -m "feat: add PlantingCard component"
```

---

### Task 4: AddPlantingSheet Component

**Files:**
- Create: `src/components/AddPlantingSheet.jsx`

Bottom sheet for adding a planting to a bed. Includes variety picker, companion check, status selector, and notes.

- [ ] **Step 1: Create src/components/AddPlantingSheet.jsx**

```jsx
import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useGarden } from '../context/GardenContext'
import { useAuth } from '../context/AuthContext'
import { isActivePlanting } from '../utils/plantingStatus'
import VarietyPicker from './VarietyPicker'
import { X, AlertTriangle } from 'lucide-react'

function getCompanionWarnings(variety, bedPlantings, allVarieties) {
  const warnings = []
  const plantedVarieties = bedPlantings
    .filter(isActivePlanting)
    .map((p) => allVarieties.find((v) => v.id === p.varietyId))
    .filter(Boolean)

  for (const planted of plantedVarieties) {
    // Check if new variety is incompatible with planted variety
    if (planted.incompatible?.includes(variety.category)) {
      warnings.push(`${variety.name} ist unverträglich mit ${planted.name}`)
    }
    // Check if planted variety is incompatible with new variety
    if (variety.incompatible?.includes(planted.category)) {
      warnings.push(`${planted.name} ist unverträglich mit ${variety.name}`)
    }
  }
  return [...new Set(warnings)]
}

export default function AddPlantingSheet({ bedId, bedPlantings, onClose }) {
  const { varieties } = useGarden()
  const { householdId } = useAuth()
  const [selectedVariety, setSelectedVariety] = useState(null)
  const [status, setStatus] = useState('aktiv')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const warnings = selectedVariety
    ? getCompanionWarnings(selectedVariety, bedPlantings, varieties)
    : []

  const save = async () => {
    if (!selectedVariety || saving) return
    setSaving(true)
    await addDoc(collection(db, 'plantings'), {
      varietyId: selectedVariety.id,
      bedId,
      year: new Date().getFullYear(),
      status,
      sownDate: null,
      transplantDate: null,
      firstHarvestDate: null,
      notes: notes.trim() || null,
      householdId,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Pflanzung hinzufügen</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!selectedVariety ? (
          <VarietyPicker varieties={varieties} onSelect={setSelectedVariety} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <span className="text-sm font-medium text-green-800">{selectedVariety.name}</span>
              <button onClick={() => setSelectedVariety(null)} className="text-xs text-green-600 underline">
                Ändern
              </button>
            </div>

            {warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
              <div className="flex gap-2">
                {['geplant', 'aktiv'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${
                      status === s ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {s === 'geplant' ? 'Geplant' : 'Aktiv'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Notizen (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="z.B. linke Reihe, 3 Pflanzen..."
                rows={2}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Speichern...' : 'Pflanzung speichern'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AddPlantingSheet.jsx
git commit -m "feat: add AddPlantingSheet with companion planting warnings"
```

---

### Task 5: EditPlantingSheet Component

**Files:**
- Create: `src/components/EditPlantingSheet.jsx`

Bottom sheet for editing, moving, or deleting a planting.

- [ ] **Step 1: Create src/components/EditPlantingSheet.jsx**

```jsx
import { useState } from 'react'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useGarden } from '../context/GardenContext'
import { normalizeStatus } from '../utils/plantingStatus'
import { X, Trash2 } from 'lucide-react'

export default function EditPlantingSheet({ planting, varietyName, onClose }) {
  const { beds } = useGarden()
  const [bedId, setBedId] = useState(planting.bedId)
  const [status, setStatus] = useState(normalizeStatus(planting.status))
  const [notes, setNotes] = useState(planting.notes || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const save = async () => {
    if (saving) return
    setSaving(true)
    await updateDoc(doc(db, 'plantings', planting.id), {
      bedId,
      status,
      notes: notes.trim() || null,
    })
    onClose()
  }

  const remove = async () => {
    if (saving) return
    setSaving(true)
    await deleteDoc(doc(db, 'plantings', planting.id))
    onClose()
  }

  const statuses = ['geplant', 'aktiv', 'fertig']
  const statusLabels = { geplant: 'Geplant', aktiv: 'Aktiv', fertig: 'Fertig' }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{varietyName}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Beet</label>
          <select
            value={bedId}
            onChange={(e) => setBedId(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none"
          >
            {beds.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
          <div className="flex gap-2">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  status === s ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Notizen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notizen..."
            rows={2}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>

        <div className="border-t border-slate-200 pt-4">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-red-500 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" /> Pflanzung löschen
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600"
              >
                Abbrechen
              </button>
              <button
                onClick={remove}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Wirklich löschen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EditPlantingSheet.jsx
git commit -m "feat: add EditPlantingSheet for edit/move/delete plantings"
```

---

### Task 6: Rewrite BedDetail Page

**Files:**
- Modify: `src/pages/BedDetail.jsx`

Full rewrite with planting management: add button, planting list with PlantingCards, edit sheet, history section.

- [ ] **Step 1: Rewrite src/pages/BedDetail.jsx**

```jsx
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGarden } from '../context/GardenContext'
import { isActivePlanting, normalizeStatus } from '../utils/plantingStatus'
import PlantingCard from '../components/PlantingCard'
import AddPlantingSheet from '../components/AddPlantingSheet'
import EditPlantingSheet from '../components/EditPlantingSheet'
import { ArrowLeft, Plus, ChevronDown, ChevronRight } from 'lucide-react'

export default function BedDetail() {
  const { bedId } = useParams()
  const { beds, plantings, varieties, tasks } = useGarden()
  const [showAdd, setShowAdd] = useState(false)
  const [editPlanting, setEditPlanting] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const bed = beds.find((b) => b.id === bedId)
  if (!bed) return <p className="text-slate-500">Beet nicht gefunden</p>

  const bedPlantings = plantings.filter((p) => p.bedId === bedId)
  const activePlantings = bedPlantings.filter(isActivePlanting)
  const donePlantings = bedPlantings.filter((p) => normalizeStatus(p.status) === 'fertig')

  const bedTasks = tasks.filter((t) => {
    const planting = plantings.find((p) => p.id === t.plantingId)
    return planting?.bedId === bedId && !t.completed
  })

  const getVarietyName = (varietyId) => varieties.find((v) => v.id === varietyId)?.name || '—'
  const sunLabels = { full: 'Volle Sonne', partial: 'Halbschatten', shade: 'Schatten' }
  const sunEmoji = { full: '☀️', partial: '⛅', shade: '☁️' }

  // Group done plantings by year for history
  const historyByYear = {}
  for (const p of donePlantings) {
    const yr = p.year || 'Unbekannt'
    if (!historyByYear[yr]) historyByYear[yr] = []
    historyByYear[yr].push(p)
  }

  return (
    <div className="space-y-4">
      <Link to="/beete" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 inline-block">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div>
        <h2 className="text-xl font-bold">{bed.name}</h2>
        <p className="text-sm text-slate-500">
          {bed.dimensions.length}x{bed.dimensions.width} cm {sunEmoji[bed.sunExposure]} {sunLabels[bed.sunExposure]}
        </p>
      </div>

      {bed.notes && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-700">{bed.notes}</p>
        </div>
      )}

      {/* Active plantings */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Aktuelle Belegung</h3>
          <button
            onClick={() => setShowAdd(true)}
            className="p-1.5 bg-green-600 rounded-lg text-white hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {activePlantings.length === 0 ? (
          <p className="text-slate-500 text-sm">Noch nichts gepflanzt</p>
        ) : (
          <div className="space-y-2">
            {activePlantings.map((p) => (
              <PlantingCard
                key={p.id}
                planting={p}
                varietyName={getVarietyName(p.varietyId)}
                onTap={setEditPlanting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Open tasks */}
      {bedTasks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3">Offene Aufgaben</h3>
          <div className="space-y-2">
            {bedTasks.map((t) => (
              <div key={t.id} className="text-sm p-2 bg-slate-50 rounded-lg">{t.title}</div>
            ))}
          </div>
        </div>
      )}

      {/* History (done plantings) */}
      {donePlantings.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-1 font-semibold text-sm text-slate-500 w-full"
          >
            {historyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Vergangene Pflanzungen ({donePlantings.length})
          </button>
          {historyOpen && (
            <div className="mt-3 space-y-3">
              {Object.entries(historyByYear).sort(([a], [b]) => b - a).map(([year, ps]) => (
                <div key={year}>
                  <div className="text-xs font-medium text-slate-400 mb-1">{year}</div>
                  <div className="space-y-1">
                    {ps.map((p) => (
                      <div key={p.id} className="text-sm text-slate-500 px-2 py-1">
                        {getVarietyName(p.varietyId)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sheets */}
      {showAdd && (
        <AddPlantingSheet
          bedId={bedId}
          bedPlantings={bedPlantings}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editPlanting && (
        <EditPlantingSheet
          planting={editPlanting}
          varietyName={getVarietyName(editPlanting.varietyId)}
          onClose={() => setEditPlanting(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run build to verify**

```bash
cd /home/philipp/dacha-app && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/BedDetail.jsx
git commit -m "feat: rewrite BedDetail with planting management CRUD"
```

---

### Task 7: Update BedCard with Planting Preview

**Files:**
- Modify: `src/components/BedCard.jsx`

Show first 2-3 variety names instead of just "N Pflanzungen".

- [ ] **Step 1: Rewrite src/components/BedCard.jsx**

```jsx
import { Link } from 'react-router-dom'
import { Sun, CloudSun, Cloud } from 'lucide-react'
import { isActivePlanting } from '../utils/plantingStatus'

const sunIcons = {
  full: <Sun className="w-3 h-3 text-yellow-500" />,
  partial: <CloudSun className="w-3 h-3 text-amber-400" />,
  shade: <Cloud className="w-3 h-3 text-slate-400" />,
}

export default function BedCard({ bed, plantings, varieties, compact }) {
  const activePlantings = plantings.filter((p) => p.bedId === bed.id && isActivePlanting(p))
  const hasPlantings = activePlantings.length > 0

  // Build preview text: first 2-3 variety names
  let preview = ''
  if (hasPlantings && varieties) {
    const names = activePlantings
      .map((p) => varieties.find((v) => v.id === p.varietyId)?.name)
      .filter(Boolean)
    const show = compact ? 2 : 3
    if (names.length <= show) {
      preview = names.join(', ')
    } else {
      preview = names.slice(0, show).join(', ') + ` +${names.length - show}`
    }
  }

  return (
    <Link to={`/beete/${bed.id}`}
      className={`block rounded-xl border transition-colors ${
        hasPlantings ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-white border-slate-200 hover:bg-slate-50'
      } ${compact ? 'p-2' : 'p-3'}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className={`font-semibold text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}>{bed.name}</span>
        {sunIcons[bed.sunExposure]}
      </div>
      <div className={`text-slate-500 ${compact ? 'text-[10px] leading-tight' : 'text-xs'}`}>
        {preview || 'Leer'}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Update Beete.jsx to pass varieties to BedCard**

In `src/pages/Beete.jsx`, the `MiniCard` component passes `plantings` to `BedCard` but not `varieties`. Update the `MiniCard` function inside `Beete()`:

Change the destructuring at the top of Beete():
```javascript
const { beds, plantings, varieties, loading } = useGarden()
```

(It currently has `varieties` missing — add it.)

Change the MiniCard to pass varieties:
```jsx
const MiniCard = ({ name }) => {
  const bed = getBed(name)
  if (!bed) return <div className="bg-slate-100 rounded-lg p-2 text-xs text-slate-400 text-center">{name}</div>
  return <BedCard bed={bed} plantings={plantings} varieties={varieties} compact />
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BedCard.jsx src/pages/Beete.jsx
git commit -m "feat: show planting name preview on bed cards"
```

---

### Task 8: Rewrite Beete Overview Grid Layout

**Files:**
- Modify: `src/pages/Beete.jsx`

Complete grid rewrite to match the real 12.5x24m garden with L-shaped bed pairs.

- [ ] **Step 1: Rewrite src/pages/Beete.jsx**

```jsx
import { useGarden } from '../context/GardenContext'
import BedCard from '../components/BedCard'

export default function Beete() {
  const { beds, plantings, varieties, loading } = useGarden()

  if (loading) return <div className="bg-slate-200 rounded-xl h-96 animate-pulse" />

  const getBed = (name) => beds.find((b) => b.name === name)

  const Card = ({ name, className = '' }) => {
    const bed = getBed(name)
    if (!bed) return <div className={`bg-slate-100 rounded-lg p-2 text-xs text-slate-400 text-center ${className}`}>{name}</div>
    return <div className={className}><BedCard bed={bed} plantings={plantings} varieties={varieties} compact /></div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Beetplan</h2>
      <p className="text-xs text-slate-500">Layout wie im Garten. Norden oben, Sonne von Süden.</p>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-3">

        {/* === RIGHT COLUMN TOP: Gewächshaus + Erdfläche === */}
        <div className="grid grid-cols-2 gap-3">
          <div />
          <div className="space-y-2">
            <Card name="Gewächshaus" />
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center text-xs text-amber-700">
              Erdfläche (8m²)
            </div>
          </div>
        </div>

        {/* === HAUS (left) + KB13-15 (right) === */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-sm font-medium min-h-[200px]" style={{ gridRow: 'span 3' }}>
            Haus
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1">
              <Card name="KB13" />
              <Card name="KB14" />
              <Card name="KB15" />
            </div>
            {/* HB11 + HB12 in a line */}
            <div className="grid grid-cols-2 gap-2">
              <Card name="HB11" />
              <Card name="HB12" />
            </div>
            {/* HB9 + HB8: upside-down L | HB7 + HB10: mirrored L */}
            <div className="grid grid-cols-2 gap-2">
              {/* Left: HB8+HB9 upside-down L */}
              <div className="space-y-1">
                <Card name="HB9" />
                <Card name="HB8" />
              </div>
              {/* Right: HB7+HB10 mirrored L */}
              <div className="space-y-1">
                <Card name="HB10" />
                <Card name="HB7" />
              </div>
            </div>
          </div>
        </div>

        {/* === LEFT: HB1-4 under Haus | RIGHT: HB5-6 + Thuja === */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left: HB1+HB2 upside-down L, then HB3+HB4 mirrored L */}
          <div className="space-y-2">
            {/* HB2 on top (wide), HB1 below-left (narrow) = upside-down L */}
            <Card name="HB2" />
            <div className="grid grid-cols-2 gap-2">
              <Card name="HB1" />
              <div />
            </div>
            {/* HB4 on top, HB3 below (wider) = mirrored L */}
            <div className="grid grid-cols-2 gap-2">
              <div />
              <Card name="HB4" />
            </div>
            <Card name="HB3" />
          </div>

          {/* Right: HB5+HB6, Thuja below */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Card name="HB5" />
              <Card name="HB6" />
            </div>
            <div className="text-center text-xs text-slate-400">🌲 Thuja 🌲</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-1 pt-1 text-xs text-slate-400">
          <span>☀️ Süden (Sonne)</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run build to verify**

```bash
cd /home/philipp/dacha-app && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/Beete.jsx
git commit -m "feat: rewrite Beete grid to match real garden layout"
```

---

### Task 9: Add "Einpflanzen" Button to VarietyDetail

**Files:**
- Modify: `src/pages/VarietyDetail.jsx`

Add a button that opens a bed picker, then creates a planting.

- [ ] **Step 1: Rewrite src/pages/VarietyDetail.jsx**

```jsx
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useGarden } from '../context/GardenContext'
import { useAuth } from '../context/AuthContext'
import { categoryLabels } from '../utils/formatters'
import { getKW, isInKWRange } from '../utils/kw'
import { isActivePlanting } from '../utils/plantingStatus'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import { Pencil, ArrowLeft, Sprout, X, AlertTriangle } from 'lucide-react'

function BedPickerSheet({ variety, onClose }) {
  const { beds, plantings, varieties } = useGarden()
  const { householdId } = useAuth()
  const navigate = useNavigate()
  const [selectedBed, setSelectedBed] = useState(null)
  const [status, setStatus] = useState('aktiv')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Companion warnings for selected bed
  const warnings = []
  if (selectedBed) {
    const bedPlantings = plantings.filter((p) => p.bedId === selectedBed.id && isActivePlanting(p))
    for (const p of bedPlantings) {
      const planted = varieties.find((v) => v.id === p.varietyId)
      if (!planted) continue
      if (planted.incompatible?.includes(variety.category)) {
        warnings.push(`${variety.name} ist unverträglich mit ${planted.name}`)
      }
      if (variety.incompatible?.includes(planted.category)) {
        warnings.push(`${planted.name} ist unverträglich mit ${variety.name}`)
      }
    }
  }

  const save = async () => {
    if (!selectedBed || saving) return
    setSaving(true)
    await addDoc(collection(db, 'plantings'), {
      varietyId: variety.id,
      bedId: selectedBed.id,
      year: new Date().getFullYear(),
      status,
      sownDate: null,
      transplantDate: null,
      firstHarvestDate: null,
      notes: notes.trim() || null,
      householdId,
    })
    navigate(`/beete/${selectedBed.id}`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{variety.name} einpflanzen</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!selectedBed ? (
          <>
            <p className="text-sm text-slate-500">Beet auswählen:</p>
            <div className="grid grid-cols-3 gap-2">
              {beds.map((b) => {
                const count = plantings.filter((p) => p.bedId === b.id && isActivePlanting(p)).length
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBed(b)}
                    className="p-3 bg-slate-50 rounded-xl text-left hover:bg-green-50 transition-colors border border-slate-200"
                  >
                    <div className="text-sm font-semibold text-slate-800">{b.name}</div>
                    <div className="text-xs text-slate-500">{count > 0 ? `${count} Pflanzung${count > 1 ? 'en' : ''}` : 'Leer'}</div>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <span className="text-sm font-medium text-green-800">{selectedBed.name}</span>
              <button onClick={() => setSelectedBed(null)} className="text-xs text-green-600 underline">Ändern</button>
            </div>

            {warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
              <div className="flex gap-2">
                {['geplant', 'aktiv'].map((s) => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${status === s ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                    {s === 'geplant' ? 'Geplant' : 'Aktiv'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Notizen (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="z.B. 3 Pflanzen, linke Seite..." rows={2}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none resize-none" />
            </div>

            <button onClick={save} disabled={saving}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Speichern...' : 'Pflanzung speichern'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VarietyDetail() {
  const { varietyId } = useParams()
  const { varieties } = useGarden()
  const [showPlant, setShowPlant] = useState(false)
  const variety = varieties.find((v) => v.id === varietyId)
  const kw = getKW()
  if (!variety) return <p className="text-slate-500">Sorte nicht gefunden</p>

  const scheduleItems = [
    { label: 'Vorziehen', range: variety.sowIndoorsKW, active: isInKWRange(kw, variety.sowIndoorsKW) },
    { label: 'Direktsaat', range: variety.sowDirectKW, active: isInKWRange(kw, variety.sowDirectKW) },
    { label: 'Auspflanzen', range: variety.transplantKW, active: isInKWRange(kw, variety.transplantKW) },
    { label: 'Ernte', range: variety.harvestKW, active: isInKWRange(kw, variety.harvestKW) },
  ].filter((s) => s.range)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/saatgut" className="p-2 -ml-2 text-slate-500 hover:text-slate-800"><ArrowLeft className="w-5 h-5" /></Link>
        <Link to={`/saatgut/${varietyId}/bearbeiten`} className="p-2 text-slate-500 hover:text-slate-800"><Pencil className="w-5 h-5" /></Link>
      </div>
      <div>
        <h2 className="text-xl font-bold">{variety.name}</h2>
        <p className="text-slate-500 text-sm">{categoryLabels[variety.category]} {variety.type ? `— ${variety.type}` : ''}</p>
      </div>

      {/* Einpflanzen button */}
      <button
        onClick={() => setShowPlant(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700"
      >
        <Sprout className="w-4 h-4" /> Einpflanzen
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-sm">Zeitplan</h3>
        {scheduleItems.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-sm text-slate-700">{s.label}</span>
            <span className={`text-sm font-mono ${s.active ? 'text-green-600 font-bold' : 'text-slate-500'}`}>
              KW {s.range[0]}–{s.range[1]} {s.active ? '← jetzt' : ''}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-sm">Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-slate-500">Sonne</div><div>{variety.sunRequirement}</div>
          <div className="text-slate-500">Frostempfindlich</div><div>{variety.frostSensitive ? 'Ja' : 'Nein'}</div>
          {variety.succession && <><div className="text-slate-500">Staffelaussaat</div><div>Alle {variety.successionIntervalWeeks} Wochen</div></>}
          {variety.selfSeeding && <><div className="text-slate-500">Selbstaussaat</div><div>Ja</div></>}
        </div>
      </div>
      {variety.companions?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-2">Gute Nachbarn</h3>
          <div className="flex flex-wrap gap-1.5">
            {variety.companions.map((c) => <span key={c} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{c}</span>)}
          </div>
        </div>
      )}
      {variety.incompatible?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-2">Schlechte Nachbarn</h3>
          <div className="flex flex-wrap gap-1.5">
            {variety.incompatible.map((c) => <span key={c} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">{c}</span>)}
          </div>
        </div>
      )}
      {variety.notes && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-1">Notizen</h3>
          <p className="text-sm text-slate-700">{variety.notes}</p>
        </div>
      )}

      {showPlant && <BedPickerSheet variety={variety} onClose={() => setShowPlant(false)} />}
    </div>
  )
}
```

- [ ] **Step 2: Run build to verify**

```bash
cd /home/philipp/dacha-app && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/VarietyDetail.jsx
git commit -m "feat: add Einpflanzen button with bed picker to VarietyDetail"
```

---

### Task 10: Build Verification & Final Test

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

```bash
cd /home/philipp/dacha-app && npm run build
```

Expected: Build succeeds

- [ ] **Step 2: Run all tests**

```bash
cd /home/philipp/dacha-app && npx vitest run
```

Expected: All tests pass

- [ ] **Step 3: Verify in browser**

Open https://dacha-app.vercel.app after push. Check:
- Beete overview shows accurate garden layout with L-shaped pairs
- Bed cards show planting names
- Tap bed -> BedDetail shows plantings with add/edit
- "+" adds a new planting with variety search
- Companion warnings appear for incompatible plants
- Tap planting opens edit sheet, can move/change status/delete
- VarietyDetail has "Einpflanzen" button with bed picker
- History section shows done plantings
