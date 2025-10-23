// src/pages/TicketDetailPage.tsx
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  Clock,
  User,
  Tag,
  FileText,
  Calendar,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { getTickets, updateTicket, type TicketRow, type TicketStatus, type CtiKind } from "@/app/tickets"
import { getComments, createComment, subscribeToComments, type TicketComment } from "@/app/comments"
import { useAuth } from "@/app/AuthProvider"

const STATUS_OPTIONS: { value: TicketStatus; label: string; color: string }[] = [
  { value: "assigned", label: "Assigned", color: "bg-slate-100 text-slate-700 border-slate-300" },
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "researching", label: "Researching", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  { value: "work_in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "escalated", label: "Escalated", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "resolved", label: "Resolved", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
]

const CTI_OPTIONS: { value: CtiKind; label: string }[] = [
  { value: "hardware", label: "Hardware" },
  { value: "networking", label: "Networking" },
]

interface Activity {
  id: string
  type: "comment" | "status_change" | "update"
  content: string
  user: string
  timestamp: string
  metadata?: any
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [ticket, setTicket] = useState<TicketRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Editable fields
  const [ticketName, setTicketName] = useState("")
  const [status, setStatus] = useState<TicketStatus>("assigned")
  const [assignee, setAssignee] = useState("")
  const [cti, setCti] = useState<CtiKind>("hardware")
  const [notes, setNotes] = useState("")
  
  // Activity/Comments
  const [activities, setActivities] = useState<Activity[]>([])
  const [comments, setComments] = useState<TicketComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [addingComment, setAddingComment] = useState(false)

  const userEmail = (user as any)?.email as string | undefined

  // Load ticket
  useEffect(() => {
    if (!id) {
      navigate("/atlas")
      return
    }

    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const tickets = await getTickets()
        const found = tickets.find((t) => t.id === id)
        
        if (!alive) return
        
        if (!found) {
          setError("Ticket not found")
          return
        }
        
        setTicket(found)
        setTicketName(found.ticket_name)
        setStatus(found.status)
        setAssignee(found.assignee)
        setCti(found.cti)
        setNotes(found.notes || "")
        
        // Load comments
        loadComments(found.id)
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || "Failed to load ticket")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    
    return () => {
      alive = false
    }
  }, [id, navigate])

  // Load comments from Supabase
  const loadComments = async (ticketId: string) => {
    try {
      const fetchedComments = await getComments(ticketId)
      setComments(fetchedComments)
      
      // Convert comments to activities for the timeline
      const commentActivities: Activity[] = fetchedComments.map((comment) => ({
        id: comment.id,
        type: "comment" as const,
        content: comment.content,
        user: comment.user_email,
        timestamp: comment.created_at,
      }))
      
      // Add system activity for ticket creation
      const systemActivities: Activity[] = [
        {
          id: "created",
          type: "update",
          content: "Ticket created",
          user: "system",
          timestamp: ticket?.created_at || new Date().toISOString(),
        },
      ]
      
      setActivities([...commentActivities, ...systemActivities])
    } catch (e: any) {
      console.error("Failed to load comments:", e)
    }
  }

  // Subscribe to real-time comment updates
  useEffect(() => {
    if (!ticket?.id) return

    const unsubscribe = subscribeToComments(ticket.id, (payload) => {
      if (payload.eventType === "INSERT" && payload.new) {
        // Add new comment to the list
        setComments((prev) => [payload.new!, ...prev])
        
        const newActivity: Activity = {
          id: payload.new.id,
          type: "comment",
          content: payload.new.content,
          user: payload.new.user_email,
          timestamp: payload.new.created_at,
        }
        setActivities((prev) => [newActivity, ...prev])
      } else if (payload.eventType === "DELETE" && payload.old) {
        // Remove deleted comment
        setComments((prev) => prev.filter((c) => c.id !== payload.old!.id))
        setActivities((prev) => prev.filter((a) => a.id !== payload.old!.id))
      }
    })

    return () => {
      unsubscribe()
    }
  }, [ticket?.id])

  const handleSave = async () => {
    if (!ticket) return
    
    setSaving(true)
    try {
      const updated = await updateTicket(ticket.id, {
        ticket_name: ticketName,
        status,
        assignee,
        cti,
        notes: notes || null,
      })
      
      setTicket(updated)
      
      // Add activity for the update
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: "update",
        content: "Ticket updated",
        user: assignee,
        timestamp: new Date().toISOString(),
      }
      setActivities((prev) => [newActivity, ...prev])
      
      alert("Ticket updated successfully!")
    } catch (e: any) {
      alert(e?.message || "Failed to update ticket")
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket || !userEmail) return
    
    setAddingComment(true)
    try {
      await createComment({
        ticket_id: ticket.id,
        user_email: userEmail,
        content: newComment.trim(),
      })
      
      setNewComment("")
      // The real-time subscription will handle updating the UI
    } catch (e: any) {
      alert(e?.message || "Failed to add comment")
    } finally {
      setAddingComment(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return formatDate(dateStr)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900 mx-auto mb-4" />
          <p className="text-slate-600">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {error || "Ticket not found"}
          </h2>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const currentStatusColor = STATUS_OPTIONS.find((s) => s.value === status)?.color || ""

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <header className="pt-8 pb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-slate-900 hover:bg-slate-800"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-slate-500">
                  {ticket.external_id}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${currentStatusColor}`}>
                  {STATUS_OPTIONS.find((s) => s.value === status)?.label}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">{ticketName}</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ticket Information
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="ticket_name" className="text-sm font-medium text-slate-700 mb-2 block">
                    Title
                  </Label>
                  <Input
                    id="ticket_name"
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-slate-700 mb-2 block">
                      Status
                    </Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cti" className="text-sm font-medium text-slate-700 mb-2 block">
                      CTI Category
                    </Label>
                    <Select value={cti} onValueChange={(v) => setCti(v as CtiKind)}>
                      <SelectTrigger id="cti">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CTI_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="assignee" className="text-sm font-medium text-slate-700 mb-2 block">
                    Assignee
                  </Label>
                  <Input
                    id="assignee"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-slate-700 mb-2 block">
                    Notes
                  </Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full min-h-[120px] px-3 py-2 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="Add notes about this ticket..."
                  />
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Activity & Comments
              </h2>

              {/* Add Comment */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleAddComment()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addingComment}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    {addingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No activity yet</p>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3 pb-4 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex-shrink-0">
                        {activity.type === "comment" ? (
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : activity.type === "status_change" ? (
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 text-sm">
                            {activity.user}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{activity.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
                Details
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Assignee</p>
                    <p className="text-sm font-medium text-slate-900">{assignee}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">CTI Category</p>
                    <p className="text-sm font-medium text-slate-900 capitalize">{cti}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Created</p>
                    <p className="text-sm font-medium text-slate-900">
                      {formatDate(ticket.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Last Activity</p>
                    <p className="text-sm font-medium text-slate-900">
                      {formatDate(ticket.last_activity_at || ticket.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
                Quick Actions
              </h3>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setStatus("resolved")
                    handleSave()
                  }}
                  disabled={status === "resolved"}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Resolved
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setStatus("escalated")
                    handleSave()
                  }}
                  disabled={status === "escalated"}
                >
                  <AlertCircle className="h-4 w-4" />
                  Escalate Ticket
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
