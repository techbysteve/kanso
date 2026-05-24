import { Check, Clock, ExternalLink, Zap } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { ScoredBookmark } from "@/lib/scoring"
import { cn } from "@/lib/utils"

export function BookmarkCard({
  bookmark,
  className,
  isPending = false,
  onMarkAsRead,
}: {
  bookmark: ScoredBookmark
  className?: string
  isPending?: boolean
  onMarkAsRead?: () => void
}) {
  const sourceName = bookmark.source?.name || "Daily.dev"
  const readTimeStr = bookmark.readTime ? `${bookmark.readTime}m` : "Est: 5m"

  return (
    <article
      className={cn(
        "group flex flex-col gap-5 rounded-lg border border-outline-variant bg-surface-container-low p-5 sm:flex-row",
        className
      )}
    >
      {/* Publisher/Avatar & Details */}
      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Publisher source name */}
            <span className="rounded border border-primary/10 bg-primary/20 px-2 py-0.5 font-label-sm text-label-sm text-primary uppercase">
              {sourceName}
            </span>
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-muted-text">
              <Clock aria-hidden="true" className="size-3.5" />
              {readTimeStr}
            </span>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-1 rounded border border-outline-variant bg-surface-container-high px-2 py-1">
            <Zap aria-hidden="true" className="size-4 text-secondary" />
            <span className="font-label-md text-label-md font-bold text-secondary">
              {bookmark.score}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 font-headline-md text-headline-md text-on-surface transition-colors group-hover:text-primary">
          <a href={bookmark.commentsPermalink} target="_blank" rel="noreferrer">
            {bookmark.title || "Untitled Article"}
          </a>
        </h3>

        {/* Summary */}
        <p className="mb-4 line-clamp-2 font-body-md text-body-md text-muted-text">
          {bookmark.summary ||
            "No description preview available for this bookmark."}
        </p>

        {/* Explanation text */}
        <div className="mb-4 flex w-fit items-center gap-1.5 rounded border border-outline-variant/30 bg-surface-container/50 px-3 py-1.5 font-label-sm text-label-sm text-muted-text">
          <span className="text-base leading-none select-none">
            {bookmark.scoreEmoji}
          </span>
          <span>{bookmark.scoreExplanation}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex flex-wrap items-center gap-3">
          <a
            href={bookmark.url || bookmark.commentsPermalink}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-auto gap-2 px-4 py-2 font-label-md [font-size:14px] [line-height:20px] font-bold text-primary-foreground hover:bg-primary/90"
            )}
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            Open Original
          </a>
          <Button
            onClick={onMarkAsRead}
            disabled={isPending}
            className="h-auto gap-2 border-outline-variant bg-surface-container-highest px-4 py-2 font-label-md [font-size:14px] [line-height:20px] text-on-surface hover:bg-surface-variant"
            variant="outline"
          >
            <Check aria-hidden="true" className="size-4" />
            Mark as Read
          </Button>
        </div>
      </div>
    </article>
  )
}
