import { Link } from 'react-router-dom'
import { Sun, CloudSun, Cloud } from 'lucide-react'

const sunIcons = {
  full: <Sun className="w-4 h-4 text-yellow-400" />,
  partial: <CloudSun className="w-4 h-4 text-amber-400" />,
  shade: <Cloud className="w-4 h-4 text-slate-400" />,
}

export default function BedCard({ bed, plantings }) {
  const activePlantings = plantings.filter((p) => p.bedId === bed.id && p.status !== 'done')
  const hasPlantings = activePlantings.length > 0
  return (
    <Link to={`/beete/${bed.id}`}
      className={`block p-3 rounded-xl border transition-colors ${hasPlantings ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{bed.name}</span>
        {sunIcons[bed.sunExposure]}
      </div>
      <div className="text-xs text-slate-400">
        {hasPlantings ? `${activePlantings.length} Pflanzung${activePlantings.length > 1 ? 'en' : ''}` : 'Leer'}
      </div>
    </Link>
  )
}
