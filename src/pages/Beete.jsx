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

        {/* === HAUS (left) + KB13-15 + HB11-12 + HB8-10 (right) === */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-sm font-medium min-h-[200px]">
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
            {/* HB8+HB9 upside-down L | HB7+HB10 mirrored L */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Card name="HB9" />
                <Card name="HB8" />
              </div>
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
            <Card name="HB2" />
            <div className="grid grid-cols-2 gap-2">
              <Card name="HB1" />
              <div />
            </div>
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
