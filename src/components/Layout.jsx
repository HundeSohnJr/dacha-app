import { Outlet, Link } from 'react-router-dom'
import BottomNav from './BottomNav'
import KWBadge from './KWBadge'
import { Settings } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-green-600">Dacha</h1>
          <KWBadge />
        </div>
        <Link to="/einstellungen" className="p-2 text-slate-400 hover:text-slate-600">
          <Settings className="w-5 h-5" />
        </Link>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
