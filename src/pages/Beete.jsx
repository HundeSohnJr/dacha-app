import { useGarden } from '../context/GardenContext'
import BedCard from '../components/BedCard'

export default function Beete() {
  const { beds, plantings, varieties, loading } = useGarden()

  if (loading) return <div className="bg-slate-200 rounded-xl h-96 animate-pulse" />

  const getBed = (name) => beds.find((b) => b.name === name)

  const Card = ({ name }) => {
    const bed = getBed(name)
    if (!bed) return <div className="bg-slate-100 rounded-lg p-2 text-xs text-slate-400 text-center">{name}</div>
    return <BedCard bed={bed} plantings={plantings} varieties={varieties} compact />
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Beetplan</h2>
      <p className="text-xs text-slate-500">Layout wie im Garten. Norden oben, Sonne von Süden.</p>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
        {/* Two main columns side by side */}
        <div className="flex gap-3">

          {/* === LEFT COLUMN === */}
          <div className="flex-1 flex flex-col gap-2">
            {/* Haus */}
            <div className="bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-sm font-medium flex-1 min-h-[180px]">
              Haus
            </div>

            {/* HB1-4 as one tight block */}
            <div className="space-y-1">
              {/* HB2 wide, HB1 below-left (upside-down L) */}
              <Card name="HB2" />
              <div className="grid grid-cols-2 gap-2">
                <Card name="HB1" />
                <div />
              </div>
              {/* HB4 top-right, HB3 wide below (mirrored L) */}
              <div className="grid grid-cols-2 gap-2">
                <div />
                <Card name="HB4" />
              </div>
              <Card name="HB3" />
            </div>
          </div>

          {/* === RIGHT COLUMN — stretch beds evenly over full height === */}
          <div className="flex-[1.3] flex flex-col justify-between gap-2">
            <Card name="Gewächshaus" />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center text-xs text-amber-700">
              Erdfläche (8m²)
            </div>

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

            {/* HB8+HB9 (upside-down L) | HB7+HB10 (mirrored L) */}
            <div className="grid grid-cols-2 gap-2">
              {/* Left: HB9 wide on top, HB8 below-left */}
              <div>
                <Card name="HB9" />
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <Card name="HB8" />
                  <div />
                </div>
              </div>
              {/* Right: HB10 small top-right, HB7 wide bottom */}
              <div>
                <div className="grid grid-cols-2 gap-1">
                  <div />
                  <Card name="HB10" />
                </div>
                <div className="mt-1"><Card name="HB7" /></div>
              </div>
            </div>

            {/* HB5 + HB6 in a line */}
            <div className="grid grid-cols-2 gap-2">
              <Card name="HB5" />
              <Card name="HB6" />
            </div>

            <div className="text-center text-xs text-slate-400">🌲 Thuja 🌲</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-1 pt-3 text-xs text-slate-400">
          <span>☀️ Süden (Sonne)</span>
        </div>
      </div>
    </div>
  )
}
