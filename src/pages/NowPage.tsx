// src/pages/NowPage.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Clock,
  Plus,
  CheckCircle2,
  Trash2,
  Loader2,
  PlayCircle,
  StopCircle,
  Calendar,
  Hash,
  Tag,
  Ticket as TicketIcon,
} from "lucide-react"
import { useAuth } from "@/app/AuthProvider"
import {
  getActiveShift,
  startShift,
  endShift,
  getShiftTickets,
  completeShiftTicket,
  uncompleteShiftTicket,
  removeTicketFromShift,
  getShiftDuration,
  subscribeToShiftTickets,
  type Shift,
  type ShiftTicketWithDetails,
} from "@/app/shifts"
import { subscribeTickets } from "@/app/tickets"
import CreateTicketWizard from "@/components/CreateTicketWizard"

export default function NowPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userEmail = (user as any)?.email as string | undefined

  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [shiftTickets, setShiftTickets] = useState<ShiftTicketWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [shiftDuration, setShiftDuration] = useState("")

  // Modals
  const [showStartShift, setShowStartShift] = useState(false)
  const [showEndShift, setShowEndShift] = useState(false)
  const [showCreateTicket, setShowCreateTicket] = useState(false)
  const [endShiftNotes, setEndShiftNotes] = useState("")
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)

  // Load active shift
  useEffect(() => {
    if (!userEmail) return

    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const shift = await getActiveShift(userEmail)
        if (!alive) return
        setActiveShift(shift)

        if (shift) {
          const tickets = await getShiftTickets(shift.id)
          if (!alive) return
          setShiftTickets(tickets)
        }
      } catch (e: any) {
        console.error("Failed to load shift:", e)
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [userEmail])

  // Update shift duration every minute
  useEffect(() => {
    if (!activeShift) return

    const updateDuration = () => {
      setShiftDuration(getShiftDuration(activeShift))
    }

    updateDuration()
    const interval = setInterval(updateDuration, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [activeShift])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!activeShift) return

    const unsubscribe = subscribeToShiftTickets(activeShift.id, async (payload) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        // Reload tickets to get updated details
        const tickets = await getShiftTickets(activeShift.id)
        setShiftTickets(tickets)
      } else if (payload.eventType === "DELETE" && payload.old) {
        setShiftTickets((prev) => prev.filter((t) => t.id !== payload.old!.id))
      }
    })

    return () => {
      unsubscribe()
    }
  }, [activeShift])

  // Subscribe to ticket updates (for status changes)
  useEffect(() => {
    if (!activeShift || shiftTickets.length === 0) return

    const ticketIds = shiftTickets.map((st) => st.ticket_id)

    const unsubscribe = subscribeTickets((payload) => {
      // Check if the updated ticket is in our current shift
      if (payload.new && ticketIds.includes(payload.new.id)) {
        // Reload shift tickets to get the updated ticket data
        getShiftTickets(activeShift.id).then((tickets) => {
          setShiftTickets(tickets)
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [activeShift, shiftTickets])

  // Auto-complete tickets when status changes to 'resolved'
  // Auto-uncomplete tickets when status changes away from 'resolved'
  useEffect(() => {
    if (!activeShift || shiftTickets.length === 0) return

    const syncTicketCompletionStatus = async () => {
      for (const shiftTicket of shiftTickets) {
        // Auto-complete if ticket is resolved but not marked as completed
        if (shiftTicket.ticket.status === "resolved" && !shiftTicket.completed) {
          try {
            console.log(`Auto-completing resolved ticket: ${shiftTicket.ticket.external_id}`)
            await completeShiftTicket(shiftTicket.id)
          } catch (e) {
            console.error("Failed to auto-complete resolved ticket:", e)
          }
        }
        
        // Auto-uncomplete if ticket is NOT resolved but IS marked as completed
        if (shiftTicket.ticket.status !== "resolved" && shiftTicket.completed) {
          try {
            console.log(`Auto-uncompleting non-resolved ticket: ${shiftTicket.ticket.external_id}`)
            await uncompleteShiftTicket(shiftTicket.id)
          } catch (e) {
            console.error("Failed to auto-uncomplete ticket:", e)
          }
        }
      }
    }

    // Use a timeout to avoid running on every render
    const timeoutId = setTimeout(syncTicketCompletionStatus, 500)
    return () => clearTimeout(timeoutId)
  }, [shiftTickets, activeShift])

  const handleStartShift = async () => {
    if (!userEmail) return

    setStarting(true)
    try {
      const shift = await startShift(userEmail)
      setActiveShift(shift)
      setShowStartShift(false)
    } catch (e: any) {
      alert(e?.message || "Failed to start shift")
    } finally {
      setStarting(false)
    }
  }

  const handleEndShift = async () => {
    if (!activeShift) return

    setEnding(true)
    try {
      await endShift(activeShift.id, endShiftNotes || undefined)
      setActiveShift(null)
      setShiftTickets([])
      setEndShiftNotes("")
      setShowEndShift(false)
    } catch (e: any) {
      alert(e?.message || "Failed to end shift")
    } finally {
      setEnding(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!activeShift) return
    // The wizard will handle creation, we just need to reload tickets
    const tickets = await getShiftTickets(activeShift.id)
    setShiftTickets(tickets)
  }

  const handleToggleComplete = async (shiftTicket: ShiftTicketWithDetails) => {
    // Optimistic update - update UI immediately
    setShiftTickets((prev) =>
      prev.map((t) =>
        t.id === shiftTicket.id
          ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null }
          : t
      )
    )

    try {
      if (shiftTicket.completed) {
        await uncompleteShiftTicket(shiftTicket.id)
      } else {
        await completeShiftTicket(shiftTicket.id)
      }
    } catch (e: any) {
      // Revert on error
      setShiftTickets((prev) =>
        prev.map((t) =>
          t.id === shiftTicket.id
            ? { ...t, completed: shiftTicket.completed, completed_at: shiftTicket.completed_at }
            : t
        )
      )
      alert(e?.message || "Failed to update ticket")
    }
  }

  const handleRemoveTicket = async (shiftTicket: ShiftTicketWithDetails) => {
    if (!confirm("Remove this ticket from today's shift?")) return

    try {
      await removeTicketFromShift(shiftTicket.id)
    } catch (e: any) {
      alert(e?.message || "Failed to remove ticket")
    }
  }

  const completedCount = shiftTickets.filter((t) => t.completed).length
  const totalCount = shiftTickets.length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    )
  }

  // No active shift - Show start shift UI
  if (!activeShift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-6 pt-20">
          <div className="text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            {/* Icon */}
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg">
                  <Clock className="h-10 w-10 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-slate-900 animate-ping opacity-20"></div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              Ready to Begin?
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
              Start your shift to track tickets and stay organized throughout your workday
            </p>

            {/* Current time display */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm mb-8">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Start button */}
            <div>
              <Button
                onClick={() => setShowStartShift(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 gap-3 group"
                size="lg"
              >
                <PlayCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
                Start Your Shift
              </Button>
            </div>
          </div>
        </div>

        {/* Start Shift Dialog */}
        <Dialog open={showStartShift} onOpenChange={setShowStartShift}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Start Your Shift</DialogTitle>
              <DialogDescription>
                Begin tracking your work for today
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Starting Date</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Starting Time</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date().toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowStartShift(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleStartShift} 
                disabled={starting} 
                className="bg-slate-900 hover:bg-slate-800 gap-2"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    Start Shift
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Active shift - Show tickets UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pb-12">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8">
        {/* Header Section */}
        <div className="mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Now</h1>
              <p className="text-slate-600">Your active shift</p>
            </div>
            <Button
              onClick={() => setShowEndShift(true)}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 gap-2 px-6 shadow-sm transition-all hover:shadow group"
              size="lg"
            >
              <StopCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
              End Shift
            </Button>
          </div>

          {/* Shift Info Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white shadow-lg mb-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <span className="text-sm font-medium">Active Shift</span>
              </div>
              <span className="text-sm opacity-90">
                {new Date(activeShift.shift_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs opacity-75 mb-1 uppercase tracking-wider">Started At</p>
                <p className="text-xl font-bold tabular-nums">
                  {new Date(activeShift.started_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-75 mb-1 uppercase tracking-wider">Duration</p>
                <p className="text-xl font-bold tabular-nums">{shiftDuration}</p>
              </div>
              <div>
                <p className="text-xs opacity-75 mb-1 uppercase tracking-wider">Progress</p>
                <p className="text-xl font-bold tabular-nums">
                  {completedCount}/{totalCount} tickets
                </p>
              </div>
              <div>
                <p className="text-xs opacity-75 mb-1 uppercase tracking-wider">Completion</p>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold tabular-nums">{completionRate}%</p>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Shift Tickets</h2>
            <Button
              onClick={() => setShowCreateTicket(true)}
              className="bg-slate-900 hover:bg-slate-800 gap-2 shadow-sm hover:shadow transition-all group"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
              Add Ticket
            </Button>
          </div>

          {shiftTickets.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-300 p-16 text-center">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <TicketIcon className="h-8 w-8 text-slate-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No tickets yet</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Start adding tickets to track your work during this shift
              </p>
              <Button
                onClick={() => setShowCreateTicket(true)}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Your First Ticket
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shiftTickets.map((shiftTicket) => {
                const ticket = shiftTicket.ticket
                if (!ticket) return null

                return (
                  <div
                    key={shiftTicket.id}
                    className={`group relative rounded-2xl border-2 p-5 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                      shiftTicket.completed
                        ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 shadow-sm shadow-emerald-100"
                        : "bg-white/80 backdrop-blur-sm border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                    onClick={() => navigate(`/atlas/${ticket.id}`)}
                  >
                    {/* Completion Checkbox */}
                    <div
                      className="absolute top-4 right-4 z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleComplete(shiftTicket)
                      }}
                    >
                      <div
                        className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                          shiftTicket.completed
                            ? "bg-emerald-500 border-emerald-500 scale-100"
                            : "bg-white border-slate-300 hover:border-slate-400 hover:scale-110"
                        }`}
                      >
                        {shiftTicket.completed && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveTicket(shiftTicket)
                      }}
                      className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </button>

                    {/* Ticket Content */}
                    <div className="mt-8 mb-4">
                      <h3 className="font-semibold text-slate-900 mb-3 line-clamp-2 text-lg group-hover:text-blue-600 transition-colors">
                        {ticket.ticket_name}
                      </h3>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {ticket.external_id && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            <Hash className="h-3 w-3" />
                            {ticket.external_id}
                          </span>
                        )}
                        {ticket.cti && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            <Tag className="h-3 w-3" />
                            {ticket.cti}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          ticket.status === "resolved"
                            ? "bg-emerald-100 text-emerald-700"
                            : ticket.status === "work_in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : ticket.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></div>
                        {ticket.status.replace("_", " ")}
                      </span>
                      {ticket.assignee && (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                            {ticket.assignee.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* End Shift Dialog */}
      <Dialog open={showEndShift} onOpenChange={setShowEndShift}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Your Shift</DialogTitle>
            <DialogDescription>Complete your shift and save your progress</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Started:</span>
                <span className="font-medium">
                  {new Date(activeShift.started_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Duration:</span>
                <span className="font-medium">{shiftDuration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tickets:</span>
                <span className="font-medium">
                  {completedCount}/{totalCount} completed
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Shift Notes (Optional)
              </label>
              <textarea
                value={endShiftNotes}
                onChange={(e) => setEndShiftNotes(e.target.value)}
                placeholder="Add any notes about your shift..."
                className="w-full min-h-[100px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEndShift(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEndShift}
              disabled={ending}
              className="bg-red-600 hover:bg-red-700"
            >
              {ending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Ending...
                </>
              ) : (
                <>
                  <StopCircle className="h-4 w-4 mr-2" />
                  End Shift
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Wizard */}
      <CreateTicketWizard
        open={showCreateTicket}
        onOpenChange={setShowCreateTicket}
        onSuccess={handleCreateTicket}
        shiftId={activeShift.id}
      />
    </div>
  )
}

