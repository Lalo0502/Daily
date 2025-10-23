// src/components/CreateTicketWizard.tsx
import { useState } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react"
import { createTicket, type TicketInsert, type TicketStatus, type CtiKind } from "@/app/tickets"
import { addTicketToShift } from "@/app/shifts"

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "assigned", label: "Assigned" },
  { value: "pending", label: "Pending" },
  { value: "researching", label: "Researching" },
  { value: "work_in_progress", label: "In Progress" },
  { value: "escalated", label: "Escalated" },
]

const CTI_OPTIONS: { value: CtiKind; label: string }[] = [
  { value: "hardware", label: "Hardware" },
  { value: "networking", label: "Networking" },
]

interface CreateTicketWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  shiftId?: string // Optional: if provided, ticket will be added to this shift
}

export default function CreateTicketWizard({
  open,
  onOpenChange,
  onSuccess,
  shiftId,
}: CreateTicketWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    external_id: "",
    ticket_name: "",
    assignee: "",
    status: "assigned" as TicketStatus,
    cti: "hardware" as CtiKind,
    notes: "",
  })

  const totalSteps = 4

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      external_id: "",
      ticket_name: "",
      assignee: "",
      status: "assigned",
      cti: "hardware",
      notes: "",
    })
    setCurrentStep(1)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return formData.ticket_name.trim() !== "" && formData.assignee.trim() !== ""
      case 2:
        return formData.external_id.trim() !== ""
      case 3:
        return true // Notes are optional
      case 4:
        return true // Review step
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps && canGoNext()) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!canGoNext()) return

    setIsSubmitting(true)
    try {
      const ticketData: TicketInsert = {
        external_id: formData.external_id.trim(),
        ticket_name: formData.ticket_name.trim(),
        assignee: formData.assignee.trim(),
        status: formData.status,
        cti: formData.cti,
        notes: formData.notes.trim() || null,
      }

      const newTicket = await createTicket(ticketData)
      
      // If shiftId is provided, add ticket to shift
      if (shiftId) {
        await addTicketToShift({
          shift_id: shiftId,
          ticket_id: newTicket.id,
        })
      }
      
      onSuccess?.()
      handleClose()
    } catch (error: any) {
      console.error("Error creating ticket:", error)
      alert(error?.message || "Failed to create ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Ticket</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full mx-1 transition-all duration-300 ${
                  step <= currentStep
                    ? "bg-slate-900"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Basic Info</span>
            <span>Technical</span>
            <span>Notes</span>
            <span>Review</span>
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[300px] py-4">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div>
                <Label htmlFor="ticket_name" className="text-base font-semibold mb-2 block">
                  Ticket Name *
                </Label>
                <Input
                  id="ticket_name"
                  placeholder="e.g., Fix network connectivity in Building A"
                  value={formData.ticket_name}
                  onChange={(e) => updateField("ticket_name", e.target.value)}
                  className="text-base"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="assignee" className="text-base font-semibold mb-2 block">
                  Assignee *
                </Label>
                <Input
                  id="assignee"
                  placeholder="e.g., john.doe@company.com"
                  value={formData.assignee}
                  onChange={(e) => updateField("assignee", e.target.value)}
                  className="text-base"
                />
              </div>
            </div>
          )}

          {/* Step 2: Technical Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div>
                <Label htmlFor="external_id" className="text-base font-semibold mb-2 block">
                  External ID *
                </Label>
                <Input
                  id="external_id"
                  placeholder="e.g., TICK-2024-001"
                  value={formData.external_id}
                  onChange={(e) => updateField("external_id", e.target.value)}
                  className="text-base"
                  autoFocus
                />
                <p className="text-sm text-slate-500 mt-1">
                  Unique identifier for this ticket
                </p>
              </div>

              <div>
                <Label htmlFor="cti" className="text-base font-semibold mb-2 block">
                  CTI Category
                </Label>
                <Select
                  value={formData.cti}
                  onValueChange={(value) => updateField("cti", value)}
                >
                  <SelectTrigger id="cti" className="text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CTI_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-base font-semibold mb-2 block">
                  Initial Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField("status", value)}
                >
                  <SelectTrigger id="status" className="text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Notes */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div>
                <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
                  Notes (Optional)
                </Label>
                <textarea
                  id="notes"
                  placeholder="Add any additional information about this ticket..."
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="w-full min-h-[200px] px-3 py-2 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  autoFocus
                />
                <p className="text-sm text-slate-500 mt-1">
                  You can add more details or context here
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Review Your Ticket</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Ticket Name</p>
                    <p className="text-base text-slate-900 mt-1">{formData.ticket_name}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-500">Assignee</p>
                    <p className="text-base text-slate-900 mt-1">{formData.assignee}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-500">External ID</p>
                    <p className="text-base text-slate-900 mt-1">{formData.external_id}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-500">CTI Category</p>
                    <p className="text-base text-slate-900 mt-1 capitalize">{formData.cti}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-500">Status</p>
                    <p className="text-base text-slate-900 mt-1 capitalize">
                      {STATUS_OPTIONS.find((s) => s.value === formData.status)?.label}
                    </p>
                  </div>
                </div>

                {formData.notes && (
                  <div className="col-span-2 pt-4 border-t">
                    <p className="text-sm font-medium text-slate-500">Notes</p>
                    <p className="text-base text-slate-900 mt-1 whitespace-pre-wrap">
                      {formData.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  ✓ Everything looks good? Click <strong>Create Ticket</strong> to finish!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSubmitting}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={!canGoNext()} className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canGoNext() || isSubmitting}
                className="gap-2 bg-slate-900 hover:bg-slate-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Ticket
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
