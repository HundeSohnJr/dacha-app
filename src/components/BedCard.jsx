import { Link } from 'react-router-dom'
import { Sun, CloudSun, Cloud } from 'lucide-react'

const sunIcons = {
  full: <Sun className="w-3 h-3 text-yellow-500" />,
  partial: <CloudSun className="w-3 h-3 text-amber-400" />,
  shade: <Cloud className="w-3 h-3 text-slate-400" />,
}

export default function BedCard({ bed, plantings, compact }) {
  const activePlantings = plantings.filter((p) => p.bedId === bed.id && p.status !== 'done')
  const hasPlantings = activePlantings.length > 0

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
        {hasPlantings
          ? `${activePlantings.length} Pflanzung${activePlantings.length > 1 ? 'en' : ''}`
          : bed.notes
            ? (compact ? bed.notes.split(',')[0].split('(')[0].trim().slice(0, 20) : 'Leer')
            : 'Leer'
        }
      </div>
    </Link>
  )
}
