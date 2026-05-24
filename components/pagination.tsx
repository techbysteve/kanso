import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  getPageUrl: (page: number) => string
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  getPageUrl,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "mt-10 flex items-center justify-center gap-1.5 pt-6",
        className
      )}
    >
      <Link
        href={getPageUrl(currentPage - 1)}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-1 border-outline-variant text-on-surface transition-all hover:bg-primary/10 hover:text-primary",
          currentPage === 1 && "pointer-events-none opacity-40"
        )}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Previous</span>
      </Link>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => {
          const pageNum = i + 1
          const isActive = pageNum === currentPage
          return (
            <Link
              key={pageNum}
              href={getPageUrl(pageNum)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                buttonVariants({
                  variant: isActive ? "default" : "outline",
                  size: "sm",
                }),
                "min-w-8 justify-center border-outline-variant transition-all",
                isActive
                  ? "border-primary bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                  : "text-on-surface hover:bg-primary/10 hover:text-primary"
              )}
            >
              {pageNum}
            </Link>
          )
        })}
      </div>

      <Link
        href={getPageUrl(currentPage + 1)}
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-1 border-outline-variant text-on-surface transition-all hover:bg-primary/10 hover:text-primary",
          currentPage === totalPages && "pointer-events-none opacity-40"
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight aria-hidden="true" className="size-4" />
      </Link>
    </nav>
  )
}
