// src/components/Pagination.tsx
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = ""
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalItems === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Info text */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Showing</span>
            <span className="font-semibold text-slate-900">{startItem}</span>
            <span>to</span>
            <span className="font-semibold text-slate-900">{endItem}</span>
            <span>of</span>
            <span className="font-semibold text-slate-900">{totalItems}</span>
            <span className="hidden sm:inline">results</span>
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant="ghost"
              size="sm"
              disabled={!canGoPrevious}
              onClick={() => onPageChange(1)}
              className="h-9 w-9 p-0 hover:bg-slate-100 disabled:opacity-40"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="ghost"
              size="sm"
              disabled={!canGoPrevious}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-9 w-9 p-0 hover:bg-slate-100 disabled:opacity-40"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="hidden sm:flex items-center gap-1 mx-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className={`h-9 w-9 p-0 ${
                      currentPage === page
                        ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {page}
                  </Button>
                )
              ))}
            </div>

            {/* Mobile page indicator */}
            <div className="sm:hidden px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 rounded-md border border-slate-200 mx-1">
              {currentPage} / {totalPages}
            </div>

            {/* Next page */}
            <Button
              variant="ghost"
              size="sm"
              disabled={!canGoNext}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-9 w-9 p-0 hover:bg-slate-100 disabled:opacity-40"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page */}
            <Button
              variant="ghost"
              size="sm"
              disabled={!canGoNext}
              onClick={() => onPageChange(totalPages)}
              className="h-9 w-9 p-0 hover:bg-slate-100 disabled:opacity-40"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
