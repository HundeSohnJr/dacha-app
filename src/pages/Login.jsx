import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sprout } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      await login()
      navigate('/')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-8">
      <div className="flex flex-col items-center gap-3">
        <Sprout className="w-16 h-16 text-green-500" />
        <h1 className="text-3xl font-bold">Dacha</h1>
        <p className="text-slate-400 text-center">Gartenplaner für den Kleingarten</p>
      </div>
      <button onClick={handleLogin}
        className="flex items-center gap-3 px-6 py-3 bg-white text-slate-900 rounded-xl font-medium hover:bg-slate-100 transition-colors">
        Mit Google anmelden
      </button>
    </div>
  )
}
