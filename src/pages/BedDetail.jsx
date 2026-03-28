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
