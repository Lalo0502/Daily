// src/components/TicketFilters.tsx
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, SlidersHorizontal, X, Check } from "lucide-react"
import type { TicketStatus, CtiKind } from "@/pages/AtlasPage"

export type FilterValues = {
  q: string
  status: TicketStatus[]
  cti: CtiKind[]
  assignee: string
}

interface TicketFiltersProps {
  filters: FilterValues
  onFiltersChange: (filters: FilterValues) => void
  className?: string
}

const statusOptions = [
  { value: "assigned" as TicketStatus, label: "Assigned", color: "bg-slate-500", bgColor: "bg-slate-50", textColor: "text-slate-700", borderColor: "border-slate-200" },
  { value: "pending" as TicketStatus, label: "Pending", color: "bg-amber-500", bgColor: "bg-amber-50", textColor: "text-amber-700", borderColor: "border-amber-200" },
  { value: "researching" as TicketStatus, label: "Researching", color: "bg-indigo-500", bgColor: "bg-indigo-50", textColor: "text-indigo-700", borderColor: "border-indigo-200" },
  { value: "work_in_progress" as TicketStatus, label: "In Progress", color: "bg-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-700", borderColor: "border-blue-200" },
  { value: "escalated" as TicketStatus, label: "Escalated", color: "bg-rose-500", bgColor: "bg-rose-50", textColor: "text-rose-700", borderColor: "border-rose-200" },
  { value: "resolved" as TicketStatus, label: "Resolved", color: "bg-emerald-500", bgColor: "bg-emerald-50", textColor: "text-emerald-700", borderColor: "border-emerald-200" },
]

const ctiOptions = [
  { value: "hardware" as CtiKind, label: "Hardware", color: "bg-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-200" },
  { value: "networking" as CtiKind, label: "Networking", color: "bg-cyan-500", bgColor: "bg-cyan-50", textColor: "text-cyan-700", borderColor: "border-cyan-200" },
]

export default function TicketFilters({ filters, onFiltersChange, className = "" }: TicketFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasActiveFilters = filters.status.length > 0 || filters.cti.length > 0 || filters.assignee

  const handleClearAll = () => {
    onFiltersChange({ q: "", status: [], cti: [], assignee: "" })
    setIsOpen(false)
  }

  const updateFilter = (key: keyof FilterValues, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleStatus = (status: TicketStatus) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    onFiltersChange({ ...filters, status: newStatuses })
  }

  const toggleCti = (cti: CtiKind) => {
    const newCtis = filters.cti.includes(cti)
      ? filters.cti.filter(c => c !== cti)
      : [...filters.cti, cti]
    onFiltersChange({ ...filters, cti: newCtis })
  }

  const activeFiltersCount = filters.status.length + filters.cti.length + (filters.assignee ? 1 : 0)

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Search bar - siempre visible */}
      <div className="flex-1 relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 group-focus-within:scale-110 transition-all duration-300" />
        <Input
          className="pl-10 pr-10 h-11 border-slate-200 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:border-slate-900 focus-visible:shadow-md transition-all duration-300"
          placeholder="Search tickets..."
          value={filters.q}
          onChange={(e) => updateFilter("q", e.target.value)}
        />
        {filters.q && (
          <button
            onClick={() => updateFilter("q", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 hover:scale-110 hover:rotate-90 transition-all duration-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 h-11 shadow-sm border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md relative transition-all duration-300 group"
          >
            <SlidersHorizontal className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shadow-lg animate-pulse">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[600px] animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                <SlidersHorizontal className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">
                  Advanced Filters
                </div>
                <DialogDescription className="text-xs mt-0.5">
                  Select multiple options to refine your search
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Status filter - Multiple selection */}
            <div className="space-y-3 animate-in fade-in-0 slide-in-from-left-4 duration-300">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                Status
                {filters.status.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-semibold animate-in zoom-in-50 duration-200">
                    {filters.status.length} selected
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option, idx) => {
                  const isSelected = filters.status.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleStatus(option.value)}
                      style={{ animationDelay: `${idx * 50}ms` }}
                      className={`
                        group relative p-3 rounded-lg border-2 text-left transition-all duration-300
                        animate-in fade-in-0 slide-in-from-bottom-2
                        ${isSelected 
                          ? `${option.bgColor} ${option.borderColor} shadow-md scale-[1.02]` 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${option.color} ${isSelected ? 'animate-pulse' : ''}`} />
                          <span className={`text-sm font-medium transition-colors ${isSelected ? option.textColor : 'text-slate-700'}`}>
                            {option.label}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className={`h-4 w-4 ${option.textColor} animate-in zoom-in-50 duration-200`} />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CTI filter - Multiple selection */}
            <div className="space-y-3 animate-in fade-in-0 slide-in-from-left-4 duration-300 delay-100">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                Category
                {filters.cti.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-semibold animate-in zoom-in-50 duration-200">
                    {filters.cti.length} selected
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ctiOptions.map((option, idx) => {
                  const isSelected = filters.cti.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleCti(option.value)}
                      style={{ animationDelay: `${(idx + statusOptions.length) * 50}ms` }}
                      className={`
                        group relative p-3 rounded-lg border-2 text-left transition-all duration-300
                        animate-in fade-in-0 slide-in-from-bottom-2
                        ${isSelected 
                          ? `${option.bgColor} ${option.borderColor} shadow-md scale-[1.02]` 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${option.color} ${isSelected ? 'animate-pulse' : ''}`} />
                          <span className={`text-sm font-medium transition-colors ${isSelected ? option.textColor : 'text-slate-700'}`}>
                            {option.label}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className={`h-4 w-4 ${option.textColor} animate-in zoom-in-50 duration-200`} />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Assignee filter */}
            <div className="space-y-3 animate-in fade-in-0 slide-in-from-left-4 duration-300 delay-150">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                Assignee
                {filters.assignee && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold animate-in zoom-in-50 duration-200">
                    Active
                  </span>
                )}
              </label>
              <div className="relative group">
                <Input
                  className="h-11 border-2 border-slate-200 focus-visible:border-slate-900 focus-visible:ring-4 focus-visible:ring-slate-100 transition-all duration-300"
                  placeholder="Filter by name..."
                  value={filters.assignee}
                  onChange={(e) => updateFilter("assignee", e.target.value)}
                />
                {filters.assignee && (
                  <button
                    onClick={() => updateFilter("assignee", "")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 hover:scale-110 hover:rotate-90 transition-all duration-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Active filters summary */}
            {hasActiveFilters && (
              <div className="pt-4 border-t-2 border-slate-200 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-900" />
                    Active Filters
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-105 transition-all duration-300"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.status.map((status, idx) => {
                    const option = statusOptions.find(o => o.value === status)
                    if (!option) return null
                    return (
                      <span 
                        key={status}
                        style={{ animationDelay: `${idx * 50}ms` }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${option.bgColor} ${option.textColor} text-xs font-semibold border ${option.borderColor} shadow-sm animate-in zoom-in-50 duration-200 hover:scale-105 transition-transform`}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${option.color} animate-pulse`} />
                        {option.label}
                        <button 
                          onClick={() => toggleStatus(status)} 
                          className="hover:rotate-90 transition-transform duration-300"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )
                  })}
                  {filters.cti.map((cti, idx) => {
                    const option = ctiOptions.find(o => o.value === cti)
                    if (!option) return null
                    return (
                      <span 
                        key={cti}
                        style={{ animationDelay: `${(filters.status.length + idx) * 50}ms` }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${option.bgColor} ${option.textColor} text-xs font-semibold border ${option.borderColor} shadow-sm animate-in zoom-in-50 duration-200 hover:scale-105 transition-transform`}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${option.color} animate-pulse`} />
                        {option.label}
                        <button 
                          onClick={() => toggleCti(cti)} 
                          className="hover:rotate-90 transition-transform duration-300"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )
                  })}
                  {filters.assignee && (
                    <span 
                      style={{ animationDelay: `${(filters.status.length + filters.cti.length) * 50}ms` }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm animate-in zoom-in-50 duration-200 hover:scale-105 transition-transform"
                    >
                      👤 {filters.assignee}
                      <button 
                        onClick={() => updateFilter("assignee", "")} 
                        className="hover:rotate-90 transition-transform duration-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-200">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="hover:bg-slate-100 hover:scale-105 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick clear button when filters are active */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="gap-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 h-11 hover:scale-105 transition-all duration-300 animate-in fade-in-0 zoom-in-95 duration-200"
        >
          <X className="h-4 w-4 hover:rotate-90 transition-transform duration-300" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      )}
    </div>
  )
}
