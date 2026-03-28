import { Link } from 'react-router-dom'
import { getKW, isInKWRange } from '../utils/kw'
import { categoryLabels } from '../utils/formatters'

export default function VarietyCard({ variety }) {
  const kw = getKW()
  const sowNow = isInKWRange(kw, variety.sowIndoorsKW) || isInKWRange(kw, variety.sowDirectKW)
  return (
    <Link to={`/saatgut/${variety.id}`}
      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
      <div>
        <div className="font-medium text-sm text-slate-800">{variety.name}</div>
        <div className="text-xs text-slate-500">{categoryLabels[variety.category] || variety.category}</div>
      </div>
      <div className="flex items-center gap-2">
        {sowNow && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Jetzt säen</span>}
        {variety.frostSensitive && <span className="text-blue-400 text-xs">❄️</span>}
      </div>
    </Link>
  )
}
