import { useGarden } from '../context/GardenContext'
import BedCard from '../components/BedCard'

export default function Beete() {
  const { beds, plantings, varieties, loading } = useGarden()

  if (loading) return <div className="bg-slate-200 rounded-xl h-96 animate-pulse" />

  const getBed = (name) => beds.find((b) => b.name === name)

  const Card = ({ name, style }) => {
    const bed = getBed(name)
    if (!bed) return <div style={style} className="bg-slate-100 rounded-lg p-2 text-xs text-slate-400 text-center">{name}</div>
    return <div style={style}><BedCard bed={bed} plantings={plantings} varieties={varieties} compact /></div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Beetplan</h2>
      <p className="text-xs text-slate-500">Layout wie im Garten. Norden oben, Sonne von Süden.</p>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">

        {/* Main garden grid: 4 columns (left col, gap, right-left, right-right) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 0.5fr 1fr 1fr',
          gridTemplateRows: 'auto auto auto auto auto auto auto auto auto auto auto auto auto auto',
          gap: '6px',
        }}>

          {/* Row 1: Gewächshaus (right half, spans 2 cols) */}
          <div style={{ gridColumn: '1 / 3', gridRow: '1 / 3' }} />
          <Card name="Gewächshaus" style={{ gridColumn: '3 / 5', gridRow: '1' }} />

          {/* Row 2: Erdfläche */}
          <div style={{ gridColumn: '3 / 5', gridRow: '2' }} className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center text-xs text-amber-700">
            Erdfläche (8m²)
          </div>

          {/* Row 3: Haus starts + KB13-15 */}
          <div style={{ gridColumn: '1 / 3', gridRow: '3 / 8' }} className="bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-sm font-medium">
            Haus
          </div>
          <div style={{ gridColumn: '3 / 5', gridRow: '3', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
            <Card name="KB13" />
            <Card name="KB14" />
            <Card name="KB15" />
          </div>

          {/* Row 4: HB11 + HB12 in a line */}
          <Card name="HB11" style={{ gridColumn: '3', gridRow: '4' }} />
          <Card name="HB12" style={{ gridColumn: '4', gridRow: '4' }} />

          {/* Rows 5-6: HB8+HB9 (upside-down L) | HB7+HB10 (mirrored L) */}
          {/* Upside-down L = HB9 spans top-left+top-right, HB8 only bottom-left */}
          <div style={{ gridColumn: '3', gridRow: '5 / 7', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px' }}>
            <div style={{ gridColumn: '1 / 3' }}><Card name="HB9" /></div>
            <div style={{ gridColumn: '1' }}><Card name="HB8" /></div>
          </div>
          {/* Mirrored L = HB10 spans top-left+top-right, HB7 only bottom-right */}
          <div style={{ gridColumn: '4', gridRow: '5 / 7', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px' }}>
            <div style={{ gridColumn: '1 / 3' }}><Card name="HB10" /></div>
            <div style={{ gridColumn: '2' }}><Card name="HB7" /></div>
          </div>

          {/* Row 7: empty (still Haus on left) */}

          {/* Rows 8-9: HB1+HB2 (upside-down L on left) | HB5+HB6 (right) */}
          <div style={{ gridColumn: '1 / 3', gridRow: '8 / 10', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px' }}>
            <div style={{ gridColumn: '1 / 3' }}><Card name="HB2" /></div>
            <div style={{ gridColumn: '1' }}><Card name="HB1" /></div>
          </div>
          <Card name="HB5" style={{ gridColumn: '3', gridRow: '8' }} />
          <Card name="HB6" style={{ gridColumn: '4', gridRow: '8' }} />
          <div style={{ gridColumn: '3 / 5', gridRow: '9' }} className="text-center text-xs text-slate-400 py-1">
            🌲 Thuja 🌲
          </div>

          {/* Rows 10-11: HB3+HB4 (mirrored L on left) */}
          <div style={{ gridColumn: '1 / 3', gridRow: '10 / 12', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px' }}>
            <div style={{ gridColumn: '2' }}><Card name="HB4" /></div>
            <div style={{ gridColumn: '1 / 3' }}><Card name="HB3" /></div>
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
