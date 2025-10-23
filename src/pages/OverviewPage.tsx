import { useAuth } from "@/app/AuthProvider"
import { Button } from "@/components/ui/button"
import { LogOut, Calendar, Clock, TrendingUp, CheckCircle2, AlertCircle, Zap, BarChart3 } from "lucide-react"
import { useEffect, useState } from "react"
import { getTickets } from "@/app/tickets"
import { getShifts } from "@/app/shifts"
import { useNavigate } from "react-router-dom"

export default function OverviewPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalTickets: 0,
    activeTickets: 0,
    resolvedTickets: 0,
    pendingTickets: 0,
    recentShifts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const tickets = await getTickets()
      const shifts = await getShifts(user?.email || "", 5)

      setStats({
        totalTickets: tickets.length,
        activeTickets: tickets.filter((t) => t.status === "work_in_progress").length,
        resolvedTickets: tickets.filter((t) => t.status === "resolved").length,
        pendingTickets: tickets.filter((t) => t.status === "pending").length,
        recentShifts: shifts.length,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Atlas",
      description: "Ver todos los tickets",
      icon: BarChart3,
      color: "from-blue-500 to-blue-600",
      path: "/atlas",
    },
    {
      title: "Now",
      description: "Gestionar turno actual",
      icon: Zap,
      color: "from-purple-500 to-purple-600",
      path: "/now",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Overview</h1>
              <p className="text-slate-600">Dashboard de actividad y estadísticas</p>
            </div>
            <Button
              onClick={async () => await signOut()}
              variant="outline"
              className="gap-2 shadow-sm hover:shadow transition-all"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>

          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white shadow-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">👋 Bienvenido de vuelta</h2>
                <p className="text-slate-300 text-sm">
                  {user?.email}
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Estadísticas Generales</h3>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 animate-pulse">
                  <div className="h-10 w-10 bg-slate-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Tickets */}
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Total Tickets</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{stats.totalTickets}</p>
              </div>

              {/* Active Tickets */}
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">En Progreso</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{stats.activeTickets}</p>
              </div>

              {/* Resolved Tickets */}
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Resueltos</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{stats.resolvedTickets}</p>
              </div>

              {/* Pending Tickets */}
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Pendientes</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{stats.pendingTickets}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Acceso Rápido</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => (
              <div
                key={action.title}
                onClick={() => navigate(action.path)}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-slate-600 text-sm">
                        {action.description}
                      </p>
                    </div>
                    <div className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all">
                      →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Footer */}
        <div className="mt-8 pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Última actualización: {new Date().toLocaleString("es-ES")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Turnos recientes: {stats.recentShifts}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
