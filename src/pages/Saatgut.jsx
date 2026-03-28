import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGarden } from '../context/GardenContext'
import VarietyCard from '../components/VarietyCard'
import { categoryLabels } from '../utils/formatters'
import { Plus, Search } from 'lucide-react'

export default function Saatgut() {
  const { varieties, loading } = useGarden()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const categories = [...new Set(varieties.map((v) => v.category))].sort()
  const filtered = varieties.filter((v) => {
    if (categoryFilter !== 'all' && v.category !== categoryFilter) return false
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-slate-200 rounded-xl h-16 animate-pulse" />)}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Saatgut</h2>
        <Link to="/saatgut/neu" className="p-2 bg-green-600 rounded-lg text-white hover:bg-green-700"><Plus className="w-5 h-5" /></Link>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Sorte suchen..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <button onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${categoryFilter === 'all' ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
          Alle ({varieties.length})
        </button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${categoryFilter === cat ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {categoryLabels[cat] || cat} ({varieties.filter((v) => v.category === cat).length})
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((v) => <VarietyCard key={v.id || v.name} variety={v} />)}
        {filtered.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Keine Sorten gefunden</p>}
      </div>
    </div>
  )
}
