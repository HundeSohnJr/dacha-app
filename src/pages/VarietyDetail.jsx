import { useParams, Link } from 'react-router-dom'
import { useGarden } from '../context/GardenContext'
import { categoryLabels } from '../utils/formatters'
import { getKW, isInKWRange } from '../utils/kw'
import { Pencil, ArrowLeft } from 'lucide-react'

export default function VarietyDetail() {
  const { varietyId } = useParams()
  const { varieties } = useGarden()
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
          <div className="text-slate-500">Frostempfindlich</div><div>{variety.frostSensitive ? 'Ja ❄️' : 'Nein'}</div>
          {variety.succession && <><div className="text-slate-500">Staffelaussaat</div><div>Alle {variety.successionIntervalWeeks} Wochen</div></>}
          {variety.selfSeeding && <><div className="text-slate-500">Selbstaussaat</div><div>Ja 🌱</div></>}
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
      {variety.notes && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-1">Notizen</h3>
          <p className="text-sm text-slate-700">{variety.notes}</p>
        </div>
      )}
    </div>
  )
}
