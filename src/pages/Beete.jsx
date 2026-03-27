import { useGarden } from '../context/GardenContext'
import BedCard from '../components/BedCard'

export default function Beete() {
  const { beds, plantings, loading } = useGarden()
  if (loading) return <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="bg-slate-800 rounded-xl h-20 animate-pulse" />)}</div>

  const greenhouse = beds.filter((b) => b.type === 'greenhouse')
  const ground = beds.filter((b) => b.type === 'ground')
  const raised = beds.filter((b) => b.type === 'raised')
  const small = beds.filter((b) => b.type === 'small')

  const renderSection = (title, sectionBeds) => sectionBeds.length > 0 && (
    <div>
      <h3 className="text-sm font-semibold text-slate-400 mb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {sectionBeds.map((b) => <BedCard key={b.id} bed={b} plantings={plantings} />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Beete</h2>
      {renderSection('Gewächshaus', greenhouse)}
      {renderSection('Grundbeet', ground)}
      {renderSection('Hochbeete', raised)}
      {renderSection('Kleinbeete', small)}
    </div>
  )
}
