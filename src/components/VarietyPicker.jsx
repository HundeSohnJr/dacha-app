import { useState } from 'react'
import { categoryLabels } from '../utils/formatters'
import { Search } from 'lucide-react'

export default function VarietyPicker({ varieties, onSelect }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = varieties.filter((v) => {
    const matchesSearch = !search || v.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(varieties.map((v) => v.category))].sort()

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sorte suchen..."
          autoFocus
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            categoryFilter === 'all' ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          Alle
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              categoryFilter === cat ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1">
        {filtered.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v)}
            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
          >
            <div className="text-sm font-medium text-slate-800">{v.name}</div>
            <div className="text-xs text-slate-500">{categoryLabels[v.category] || v.category}</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Keine Sorten gefunden</p>
        )}
      </div>
    </div>
  )
}
