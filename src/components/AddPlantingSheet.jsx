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
    if (planted.incompatible?.includes(variety.category)) {
      warnings.push(`${variety.name} ist unverträglich mit ${planted.name}`)
    }
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
  const [freeMode, setFreeMode] = useState(false)
  const [customName, setCustomName] = useState('')
  const [status, setStatus] = useState('aktiv')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const warnings = selectedVariety
    ? getCompanionWarnings(selectedVariety, bedPlantings, varieties)
    : []

  const canSave = freeMode ? customName.trim().length > 0 : !!selectedVariety

  const save = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const plantingData = {
        bedId,
        year: new Date().getFullYear(),
        status,
        sownDate: null,
        transplantDate: null,
        firstHarvestDate: null,
        notes: notes.trim() || null,
        householdId,
      }
      if (freeMode) {
        plantingData.varietyId = null
        plantingData.customName = customName.trim()
      } else {
        plantingData.varietyId = selectedVariety.id
      }
      await addDoc(collection(db, 'plantings'), plantingData)
      onClose()
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Pflanzung hinzufügen</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!selectedVariety && !freeMode ? (
          <div className="space-y-3">
            <VarietyPicker varieties={varieties} onSelect={setSelectedVariety} />
            <button
              onClick={() => setFreeMode(true)}
              className="w-full text-sm text-slate-500 hover:text-green-700 py-2"
            >
              Oder: Freie Pflanzung anlegen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {freeMode ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Pflanzenname</label>
                  <button
                    onClick={() => { setFreeMode(false); setCustomName('') }}
                    className="text-xs text-green-600 underline"
                  >
                    Sorte wählen
                  </button>
                </div>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="z.B. Erdbeeren, Rhabarber, Liebstöckel..."
                  autoFocus
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <span className="text-sm font-medium text-green-800">{selectedVariety.name}</span>
                <button onClick={() => setSelectedVariety(null)} className="text-xs text-green-600 underline">
                  Ändern
                </button>
              </div>
            )}

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
              disabled={saving || !canSave}
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
