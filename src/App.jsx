import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { GardenProvider } from './context/GardenContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Beete from './pages/Beete'
import BedDetail from './pages/BedDetail'
import Aufgaben from './pages/Aufgaben'
import Wetter from './pages/Wetter'
import Saatgut from './pages/Saatgut'
import VarietyDetail from './pages/VarietyDetail'
import VarietyForm from './pages/VarietyForm'
import ErnteLog from './pages/ErnteLog'
import Einstellungen from './pages/Einstellungen'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><GardenProvider><Layout /></GardenProvider></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="beete" element={<Beete />} />
            <Route path="beete/:bedId" element={<BedDetail />} />
            <Route path="aufgaben" element={<Aufgaben />} />
            <Route path="wetter" element={<Wetter />} />
            <Route path="saatgut" element={<Saatgut />} />
            <Route path="saatgut/:varietyId" element={<VarietyDetail />} />
            <Route path="saatgut/neu" element={<VarietyForm />} />
            <Route path="saatgut/:varietyId/bearbeiten" element={<VarietyForm />} />
            <Route path="ernte" element={<ErnteLog />} />
            <Route path="einstellungen" element={<Einstellungen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
