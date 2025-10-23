// src/App.tsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/app/AuthProvider"
import LoginPage from "@/pages/LoginPage"
import OverviewPage from "@/pages/OverviewPage"
import NowPage from "@/pages/NowPage"
import AtlasPage from "@/pages/AtlasPage"
import TicketDetailPage from "@/pages/TicketDetailPage"
import ShukanPage from "@/pages/ShukanPage"
import NexoPage from "@/pages/NexoPage"
import DojoPage from "@/pages/DojoPage"
import AppLayout from "@/components/AppLayout"

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center">Cargando…</div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/overview" replace /> : <LoginPage />}
      />

      {/* Rutas protegidas bajo layout */}
      <Route element={<Protected />}>
        <Route element={<AppLayout />}>
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/now" element={<NowPage />} />
          <Route path="/atlas" element={<AtlasPage />} />
          <Route path="/atlas/:id" element={<TicketDetailPage />} />
          <Route path="/shukan" element={<ShukanPage />} />
          <Route path="/nexo" element={<NexoPage />} />
          <Route path="/dojo" element={<DojoPage />} />
        </Route>
      </Route>

      {/* Default / 404 */}
      <Route path="/" element={<Navigate to={user ? "/overview" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={user ? "/overview" : "/login"} replace />} />
    </Routes>
  )
}
