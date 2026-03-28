import { useAuth } from '../context/AuthContext'
import { requestNotificationPermission } from '../services/notifications'
import { useState } from 'react'
import { Bell, LogOut, User } from 'lucide-react'

export default function Einstellungen() {
  const { user, householdId, logout } = useAuth()
  const [notifStatus, setNotifStatus] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const enableNotifications = async () => {
    const token = await requestNotificationPermission(user.uid, householdId)
    setNotifStatus(token ? 'granted' : 'denied')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Einstellungen</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <User className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <div className="font-medium text-sm">{user?.displayName || 'User'}</div>
          <div className="text-xs text-slate-500">{user?.email}</div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-500" />
            <div>
              <div className="text-sm font-medium">Push-Benachrichtigungen</div>
              <div className="text-xs text-slate-500">Frost, Aufgaben, Wetter</div>
            </div>
          </div>
          {notifStatus === 'granted' ? (
            <span className="text-xs text-green-600 font-medium">Aktiv</span>
          ) : (
            <button onClick={enableNotifications} className="px-3 py-1.5 bg-green-600 rounded-lg text-xs font-medium text-white">Aktivieren</button>
          )}
        </div>
      </div>
      <button onClick={logout}
        className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl text-red-500 hover:bg-slate-50">
        <LogOut className="w-4 h-4" /><span className="text-sm">Abmelden</span>
      </button>
    </div>
  )
}
