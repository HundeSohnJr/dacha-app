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
