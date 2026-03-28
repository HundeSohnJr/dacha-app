import { useGarden } from '../context/GardenContext'
import BedCard from '../components/BedCard'

export default function Beete() {
  const { beds, plantings, loading } = useGarden()

  if (loading) return <div className="bg-slate-200 rounded-xl h-96 animate-pulse" />

  const getBed = (name) => beds.find((b) => b.name === name)

  const MiniCard = ({ name }) => {
    const bed = getBed(name)
    if (!bed) return <div className="bg-slate-100 rounded-lg p-2 text-xs text-slate-400 text-center">{name}</div>
    return <BedCard bed={bed} plantings={plantings} compact />
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Beetplan</h2>
      <p className="text-xs text-slate-500">Layout wie im Garten. Norden oben, Sonne von Süden (unten).</p>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-3">

        {/* Top row: Haus (left) | Gewächshaus + Grundbeet + Kleinbeete (right) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left: Haus */}
          <div className="bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-sm font-medium min-h-[160px]">
            Haus
          </div>

          {/* Right: Gewächshaus area */}
          <div className="space-y-2">
            <MiniCard name="Gewächshaus" />
            <MiniCard name="Grundbeet" />
            <div className="grid grid-cols-3 gap-1">
              <MiniCard name="KB13" />
              <MiniCard name="KB14" />
              <MiniCard name="KB15" />
            </div>
          </div>
        </div>

        {/* Middle-upper: HB11+HB12 (right side) */}
        <div className="grid grid-cols-2 gap-3">
          <div />
          <div className="grid grid-cols-2 gap-2">
            <MiniCard name="HB11" />
            <MiniCard name="HB12" />
          </div>
        </div>

        {/* Middle: HB9+HB10 (right side) */}
        <div className="grid grid-cols-2 gap-3">
          <div />
          <div className="grid grid-cols-2 gap-2">
            <MiniCard name="HB9" />
            <MiniCard name="HB10" />
          </div>
        </div>

        {/* Middle-lower: HB1+HB2 (left) | HB8+HB7 (right) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <MiniCard name="HB1" />
              <MiniCard name="HB2" />
            </div>
            <MiniCard name="HB4" />
            <MiniCard name="HB3" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MiniCard name="HB8" />
            <MiniCard name="HB7" />
          </div>
        </div>

        {/* Bottom: HB5+HB6 (right, behind Thuja) */}
        <div className="grid grid-cols-2 gap-3">
          <div />
          <div>
            <div className="text-center text-xs text-slate-400 mb-1">🌲 Thuja 🌲</div>
            <div className="grid grid-cols-2 gap-2">
              <MiniCard name="HB5" />
              <MiniCard name="HB6" />
            </div>
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
