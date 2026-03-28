import { NavLink } from 'react-router-dom'
import { Home, Map, CheckSquare, CloudSun, Leaf } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/beete', icon: Map, label: 'Beete' },
  { to: '/aufgaben', icon: CheckSquare, label: 'Aufgaben' },
  { to: '/wetter', icon: CloudSun, label: 'Wetter' },
  { to: '/saatgut', icon: Leaf, label: 'Saatgut' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                isActive ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }>
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
