import { useParams, Link } from 'react-router-dom'
import { useGarden } from '../context/GardenContext'
import { ArrowLeft } from 'lucide-react'

export default function BedDetail() {
  const { bedId } = useParams()
  const { beds, plantings, varieties, tasks } = useGarden()
  const bed = beds.find((b) => b.id === bedId)
  if (!bed) return <p className="text-slate-400">Beet nicht gefunden</p>

  const bedPlantings = plantings.filter((p) => p.bedId === bedId)
  const bedTasks = tasks.filter((t) => {
    const planting = plantings.find((p) => p.id === t.plantingId)
    return planting?.bedId === bedId && !t.completed
  })
  const getVarietyName = (varietyId) => varieties.find((v) => v.id === varietyId)?.name || '—'
  const sunLabels = { full: 'Volle Sonne ☀️', partial: 'Halbschatten ⛅', shade: 'Schatten ☁️' }

  return (
    <div className="space-y-4">
      <Link to="/beete" className="p-2 -ml-2 text-slate-400 hover:text-white inline-block"><ArrowLeft className="w-5 h-5" /></Link>
      <div>
        <h2 className="text-xl font-bold">{bed.name}</h2>
        <p className="text-sm text-slate-400">{bed.dimensions.length}×{bed.dimensions.width} cm • {sunLabels[bed.sunExposure]}</p>
      </div>
      {bed.notes && <div className="bg-slate-800 rounded-xl p-4"><p className="text-sm text-slate-300">{bed.notes}</p></div>}
      <div className="bg-slate-800 rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3">Aktuelle Pflanzungen</h3>
        {bedPlantings.length === 0 ? <p className="text-slate-500 text-sm">Noch nichts gepflanzt</p> : (
          <div className="space-y-2">
            {bedPlantings.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                <span className="text-sm">{getVarietyName(p.varietyId)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {bedTasks.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3">Offene Aufgaben</h3>
          <div className="space-y-2">
            {bedTasks.map((t) => <div key={t.id} className="text-sm p-2 bg-slate-700/50 rounded-lg">{t.title}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}
