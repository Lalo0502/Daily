// src/pages/AtlasPage.tsx
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from "@/components/ui/select"
import { 
  Map, RefreshCw, Search, X, ArrowUpDown, Clock, Tag, Layers, TrendingUp, CheckCircle2, Plus
} from "lucide-react"
import { getTickets, updateTicket } from "@/app/tickets.ts"
import TicketFilters, { type FilterValues } from "@/components/TicketFilters"
import Pagination from "@/components/Pagination"
import CreateTicketWizard from "@/components/CreateTicketWizard"

export type TicketStatus =
  | "assigned"
  | "pending"
  | "researching"
  | "work_in_progress"
  | "escalated"
  | "resolved"

export type CtiKind = "hardware" | "networking"

export interface Ticket {
  id: string
  external_id: string
  ticket_name: string
  status: TicketStatus
  assignee: string
  cti: CtiKind
  notes?: string | null
  last_activity_at?: string | null
  updated_at?: string | null
}

// === Mapeos visuales modernos ===
const STATUS_LABEL: Record<TicketStatus, string> = {
  assigned: "Assigned",
  pending: "Pending",
  researching: "Researching",
  work_in_progress: "In Progress",
  escalated: "Escalated",
  resolved: "Resolved",
}

const STATUS_CLASS: Record<TicketStatus, string> = {
  assigned: "bg-slate-50 text-slate-700 border border-slate-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  researching: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  work_in_progress: "bg-blue-50 text-blue-700 border border-blue-200",
  escalated: "bg-rose-50 text-rose-700 border border-rose-200",
  resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
}

const STATUS_DOT: Record<TicketStatus, string> = {
  assigned: "bg-slate-500",
  pending: "bg-amber-500",
  researching: "bg-indigo-500",
  work_in_progress: "bg-blue-500",
  escalated: "bg-rose-500",
  resolved: "bg-emerald-500",
}

const CTI_LABEL: Record<CtiKind, string> = {
  hardware: "Hardware",
  networking: "Networking",
}

const CTI_CLASS: Record<CtiKind, string> = {
  hardware: "bg-purple-50 text-purple-700 border border-purple-200",
  networking: "bg-cyan-50 text-cyan-700 border border-cyan-200",
}

// === Helpers ===
function fmtDate(ts?: string | null) {
  if (!ts) return "—"
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ value }: { value: TicketStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-300 ${STATUS_CLASS[value]}`}>
      <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${STATUS_DOT[value]}`} />
      {STATUS_LABEL[value]}
    </span>
  )
}

function CtiBadge({ value }: { value: CtiKind }) {
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-300 ${CTI_CLASS[value]}`}>
      <Tag className="h-3 w-3 mr-1" />
      {CTI_LABEL[value]}
    </span>
  )
}

// === Filtros de la vista ===
type Filters = FilterValues

// === Página: Atlas (All Tickets) ===
export default function AtlasPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<Filters>({
    q: "",
    status: [],
    cti: [],
    assignee: "",
  })

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const [sortBy, setSortBy] = useState<keyof Ticket>("last_activity_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateWizard, setShowCreateWizard] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const rows = await getTickets()
        if (!alive) return
        setTickets(rows || [])
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || "Failed to load tickets.")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    const a = filters.assignee.trim().toLowerCase()
    return tickets.filter((t) => {
      // Si hay statuses seleccionados, el ticket debe estar en la lista
      if (filters.status.length > 0 && !filters.status.includes(t.status)) return false
      // Si hay CTIs seleccionados, el ticket debe estar en la lista
      if (filters.cti.length > 0 && !filters.cti.includes(t.cti)) return false
      // Filtro por assignee
      if (a && !t.assignee.toLowerCase().includes(a)) return false
      // Búsqueda de texto
      if (q) {
        const hay =
          t.external_id.toLowerCase().includes(q) ||
          t.ticket_name.toLowerCase().includes(q) ||
          (t.notes ?? "").toLowerCase().includes(q)
        if (!hay) return false
      }
      return true
    })
  }, [tickets, filters])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      const va = (a[sortBy] ?? "") as any
      const vb = (b[sortBy] ?? "") as any

      if (sortBy === "last_activity_at" || sortBy === "updated_at") {
        const ta = va ? new Date(va).getTime() : 0
        const tb = vb ? new Date(vb).getTime() : 0
        return ta === tb ? 0 : ta > tb ? dir : -dir
      }
      if (typeof va === "string" && typeof vb === "string") {
        return va.localeCompare(vb) * dir
      }
      return (va > vb ? 1 : va < vb ? -1 : 0) * dir
    })
    return copy
  }, [filtered, sortBy, sortDir])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageSafe = Math.min(page, totalPages)
  const start = (pageSafe - 1) * pageSize
  const end = start + pageSize
  const pageRows = sorted.slice(start, end)

  function toggleSort(col: keyof Ticket) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir("asc")
    }
  }

  async function handleInlineStatusChange(t: Ticket, next: TicketStatus) {
    const prev = t.status
    setTickets((cur) => cur.map((row) => (row.id === t.id ? { ...row, status: next } : row)))
    try {
      await updateTicket(t.id, { status: next })
    } catch (e) {
      setTickets((cur) => cur.map((row) => (row.id === t.id ? { ...row, status: prev } : row)))
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    setError(null)
    try {
      const rows = await getTickets()
      setTickets(rows || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load tickets.")
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = tickets.length
    const active = tickets.filter(t => !["resolved"].includes(t.status)).length
    const resolved = tickets.filter(t => t.status === "resolved").length
    return { total, active, resolved }
  }, [tickets])

  return (
    <div className="min-h-screen bg-white pb-12 relative overflow-hidden">
      {/* Figuras que pasan ocasionalmente */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Círculos que cruzan la pantalla */}
        <div className="absolute top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full blur-2xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-52 h-52 bg-gradient-to-br from-violet-100 to-violet-50 rounded-full blur-2xl opacity-25 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-32 -left-16 w-44 h-44 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full blur-2xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 relative z-10">
        {/* Header compacto */}
        <header className="pt-8 pb-6 animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 relative">
                <Map className="h-4 w-4 text-white" />
                <div className="absolute inset-0 bg-white/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Atlas</h1>
                <p className="text-xs text-slate-500">Ticket Landscape</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="default"
                className="gap-2 shadow-sm hover:shadow-md hover:scale-105 bg-slate-900 hover:bg-slate-800 text-white transition-all duration-300 group"
                onClick={() => setShowCreateWizard(true)}
              >
                <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                <span>New Ticket</span>
              </Button>

              <Button
                variant="outline"
                disabled={refreshing}
                className="gap-2 shadow-sm hover:shadow-md hover:scale-105 border-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-300 group bg-white/80 backdrop-blur-sm"
                onClick={handleRefresh}
              >
                <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Layout con sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-6 max-w-[1500px] mx-auto">
          {/* Sidebar con Stats */}
          <aside className="space-y-4 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-100">
            {/* Stats cards verticales */}
            <div className="grid grid-cols-3 xl:grid-cols-1 gap-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 col-span-3 xl:col-span-1">Overview</h2>
              
              <div className="group p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-slate-200 shadow-sm hover:shadow-lg hover:scale-105 hover:border-slate-900 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
                    <Layers className="h-5 w-5 text-slate-600 group-hover:text-white transition-colors duration-300 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-700 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
                </div>
                <div className="space-y-1">
                  <span className="text-3xl font-bold text-slate-900 block tabular-nums">{stats.total}</span>
                  <p className="text-xs text-slate-500">All tickets</p>
                </div>
              </div>
              
              <div className="group p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-sm hover:shadow-lg hover:scale-105 hover:border-blue-500 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300 relative overflow-hidden">
                    <TrendingUp className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors duration-300 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </div>
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Active</span>
                </div>
                <div className="space-y-1">
                  <span className="text-3xl font-bold text-blue-600 block tabular-nums">{stats.active}</span>
                  <p className="text-xs text-slate-500">In progress</p>
                </div>
              </div>
              
              <div className="group p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-emerald-200 shadow-sm hover:shadow-lg hover:scale-105 hover:border-emerald-500 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 transition-colors duration-300 relative overflow-hidden">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 group-hover:text-white transition-colors duration-300 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Done</span>
                </div>
                <div className="space-y-1">
                  <span className="text-3xl font-bold text-emerald-600 block tabular-nums">{stats.resolved}</span>
                  <p className="text-xs text-slate-500">Resolved</p>
                </div>
              </div>
            </div>

            {/* Quick info */}
            <div className="p-4 rounded-xl bg-slate-900 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <p className="text-xs font-medium mb-2 opacity-70">Filtered Results</p>
                <p className="text-2xl font-bold tabular-nums">{filtered.length}</p>
                <p className="text-xs opacity-70 mt-1">
                  {filtered.length === tickets.length ? 'Showing all' : `of ${tickets.length} total`}
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          </aside>

          {/* Main content area */}
          <main className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-150">
            {/* Filtros */}
            <TicketFilters
              filters={filters}
              onFiltersChange={(newFilters) => {
                setPage(1)
                setFilters(newFilters)
              }}
            />

            {/* Tabla */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 px-6 py-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="grid grid-cols-[100px_1fr_160px_200px_120px_160px] gap-4 text-xs font-bold text-slate-700 uppercase tracking-wider relative z-10">
                  <div 
                    className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-slate-900 group transition-all duration-300" 
                    onClick={() => toggleSort("external_id")}
                  >
                    ID 
                    <ArrowUpDown className={`h-3.5 w-3.5 transition-all duration-300 ${sortBy === "external_id" ? 'text-slate-900 scale-110' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 group transition-all duration-300 pl-2" 
                    onClick={() => toggleSort("ticket_name")}
                  >
                    Title 
                    <ArrowUpDown className={`h-3.5 w-3.5 transition-all duration-300 ${sortBy === "ticket_name" ? 'text-slate-900 scale-110' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                  <div className="flex items-center justify-center">Status</div>
                  <div 
                    className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-slate-900 group transition-all duration-300" 
                    onClick={() => toggleSort("assignee")}
                  >
                    Assignee 
                    <ArrowUpDown className={`h-3.5 w-3.5 transition-all duration-300 ${sortBy === "assignee" ? 'text-slate-900 scale-110' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                  <div className="flex items-center justify-center">CTI</div>
                  <div 
                    className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-slate-900 group transition-all duration-300" 
                    onClick={() => toggleSort("last_activity_at")}
                  >
                    <Clock className="h-3.5 w-3.5" /> Activity
                    <ArrowUpDown className={`h-3.5 w-3.5 transition-all duration-300 ${sortBy === "last_activity_at" ? 'text-slate-900 scale-110' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </div>
              </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-16 text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mb-4"></div>
                <p className="text-sm font-medium text-slate-600 animate-pulse">Loading tickets...</p>
              </div>
            ) : error ? (
              <div className="p-16 text-center animate-in fade-in-0 zoom-in-95 duration-300">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-4 animate-pulse">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-sm font-semibold text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleRefresh}
                >
                  Try Again
                </Button>
              </div>
            ) : pageRows.length === 0 ? (
              <div className="p-16 text-center animate-in fade-in-0 zoom-in-95 duration-300">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-50 mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600 mb-2">No tickets found</p>
                <p className="text-xs text-slate-500">Try adjusting your filters</p>
              </div>
            ) : (
              pageRows.map((t, idx) => (
                <div
                  key={t.id}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className="grid grid-cols-[100px_1fr_160px_200px_120px_160px] gap-4 px-6 py-4 hover:bg-slate-50 transition-all duration-300 group cursor-pointer animate-in fade-in-0 slide-in-from-bottom-2 border-l-4 border-transparent hover:border-l-slate-900 hover:shadow-sm"
                  onClick={() => navigate(`/atlas/${t.id}`)}
                >
                  <div className="flex items-center justify-center">
                    <code className="text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                      {t.external_id}
                    </code>
                  </div>
                  <div className="flex items-center min-w-0 pl-2">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-slate-900 transition-colors">
                      {t.ticket_name}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <Select
                      value={t.status}
                      onValueChange={(next) => {
                        handleInlineStatusChange(t, next as TicketStatus)
                      }}
                    >
                      <SelectTrigger 
                        className="h-9 border-0 shadow-none hover:bg-white hover:shadow-sm transition-all duration-300" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue>
                          <StatusBadge value={t.status} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          ["assigned","pending","researching","work_in_progress","escalated","resolved"] as TicketStatus[]
                        ).map((s) => (
                          <SelectItem key={s} value={s}>
                            <StatusBadge value={s} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-center min-w-0">
                    <div className="flex items-center gap-2.5 group-hover:scale-105 transition-transform duration-300 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-xs font-bold flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 flex-shrink-0">
                        {t.assignee.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate">{t.assignee}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <CtiBadge value={t.cti} />
                  </div>
                  <div className="flex items-center justify-center text-xs text-slate-500 font-medium">
                    {fmtDate(t.last_activity_at || t.updated_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Paginación */}
        {!loading && !error && pageRows.length > 0 && (
          <Pagination
            currentPage={pageSafe}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={setPage}
          />
        )}
          </main>
        </div>
      </div>

      {/* Create Ticket Wizard */}
      <CreateTicketWizard
        open={showCreateWizard}
        onOpenChange={setShowCreateWizard}
        onSuccess={handleRefresh}
      />
    </div>
  )
}