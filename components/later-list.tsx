"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useKansoStore } from "@/hooks/use-kanso-store"
import { useScoringStore } from "@/hooks/use-scoring-store"
import {
  CalendarClock,
  Check,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  MoveRight,
  SlidersHorizontal,
  Star,
  Trash2,
  Zap,
} from "lucide-react"
import Link from "next/link"

import { Pagination } from "@/components/pagination"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  deleteBookmarkAction,
  moveBookmarkToReadAction,
  moveBookmarkToShortlistAction,
} from "@/lib/actions"
import { matchesBookmarkSearch } from "@/lib/bookmark-search"
import { calculatePriorityScores, ScoredBookmark } from "@/lib/scoring"
import { cn } from "@/lib/utils"

type LaterSort = "oldest" | "score" | "shortest"

interface LaterListProps {
  initialBookmarks: ScoredBookmark[]
  isPlus: boolean
  shortlistId: string | null
  laterId: string | null
  readId: string | null
  listError: string | null
  sort: LaterSort
  currentPage: number
  tag: string
  source: string
  readTime: string
  query: string
}

const sortLabels: Record<LaterSort, string> = {
  oldest: "Oldest first",
  score: "Highest score",
  shortest: "Shortest read",
}

export function LaterList({
  initialBookmarks,
  isPlus,
  shortlistId,
  readId,
  listError,
  sort,
  currentPage,
  tag,
  source,
  readTime,
  query,
}: LaterListProps) {
  const [mounted, setMounted] = useState(false)
  const [bookmarks, setBookmarks] = useState<ScoredBookmark[]>(initialBookmarks)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Zustand Store selectors
  const localLater = useKansoStore((state) => state.localLater)
  const removeFromLocalLater = useKansoStore(
    (state) => state.removeFromLocalLater
  )
  const addToLocalShortlist = useKansoStore(
    (state) => state.addToLocalShortlist
  )
  const addToLocalRead = useKansoStore((state) => state.addToLocalRead)
  const scoringSettings = useScoringStore((state) => state.settings)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)

      if (!isPlus) {
        setBookmarks(calculatePriorityScores(localLater, scoringSettings))
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [isPlus, localLater, scoringSettings])

  const tags = useMemo(() => {
    const uniqueTags = new Set<string>()
    bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((bookmarkTag) => uniqueTags.add(bookmarkTag))
    })
    return Array.from(uniqueTags)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 8)
  }, [bookmarks])

  const sources = useMemo(() => {
    const uniqueSources = new Set<string>()
    bookmarks.forEach((bookmark) => {
      const sourceName = bookmark.source?.name
      if (sourceName) uniqueSources.add(sourceName)
    })
    return Array.from(uniqueSources)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 6)
  }, [bookmarks])

  const visibleBookmarks = useMemo(() => {
    const maxReadTime = readTime ? Number(readTime) : null
    const filtered = bookmarks.filter((bookmark) => {
      const matchesTag = tag ? bookmark.tags.includes(tag) : true
      const matchesSource = source ? bookmark.source?.name === source : true
      const matchesReadTime = maxReadTime
        ? (bookmark.readTime || 5) <= maxReadTime
        : true
      const matchesSearch = matchesBookmarkSearch(bookmark, query)

      return matchesTag && matchesSource && matchesReadTime && matchesSearch
    })

    return filtered.toSorted((a, b) => {
      if (sort === "score") return b.score - a.score
      if (sort === "shortest") return (a.readTime || 5) - (b.readTime || 5)
      return (
        new Date(a.bookmarkedAt || a.createdAt).getTime() -
        new Date(b.bookmarkedAt || b.createdAt).getTime()
      )
    })
  }, [bookmarks, query, readTime, source, sort, tag])

  const estReadingTime = visibleBookmarks.reduce(
    (sum, bookmark) => sum + (bookmark.readTime || 5),
    0
  )

  const itemsPerPage = 10
  const totalItems = visibleBookmarks.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const activePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1
  const startIndex = (activePage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedBookmarks = visibleBookmarks.slice(startIndex, endIndex)

  const buildUrl = (updates: Partial<Record<string, string | null>>) => {
    const params = new URLSearchParams()
    if (sort !== "oldest") params.set("sort", sort)
    if (tag) params.set("tag", tag)
    if (source) params.set("source", source)
    if (readTime) params.set("readTime", readTime)
    if (query) params.set("q", query)

    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })

    params.delete("page")
    const queryString = params.toString()
    return queryString ? `/later?${queryString}` : "/later"
  }

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (sort !== "oldest") params.set("sort", sort)
    if (tag) params.set("tag", tag)
    if (source) params.set("source", source)
    if (readTime) params.set("readTime", readTime)
    if (query) params.set("q", query)
    params.set("page", page.toString())
    return `/later?${params.toString()}`
  }

  const removeLocalLaterBookmark = (bookmarkId: string) => {
    removeFromLocalLater(bookmarkId)
    setBookmarks((current) => current.filter((b) => b.id !== bookmarkId))
  }

  const moveLocalBookmarkToShortlist = (bookmark: ScoredBookmark) => {
    addToLocalShortlist(bookmark)
    removeLocalLaterBookmark(bookmark.id)
  }

  const moveLocalBookmarkToRead = (bookmark: ScoredBookmark) => {
    addToLocalRead(bookmark)
    removeLocalLaterBookmark(bookmark.id)
  }

  const runAction = (
    bookmark: ScoredBookmark,
    action: "shortlist" | "read" | "clear"
  ) => {
    setPendingId(bookmark.id)
    setActionError(null)

    startTransition(async () => {
      try {
        if (action === "shortlist") {
          if (isPlus && shortlistId) {
            await moveBookmarkToShortlistAction(bookmark.id, shortlistId)
            setBookmarks((current) =>
              current.filter((item) => item.id !== bookmark.id)
            )
          } else {
            moveLocalBookmarkToShortlist(bookmark)
          }
        } else if (action === "clear") {
          if (isPlus) {
            await deleteBookmarkAction(bookmark.id)
            setBookmarks((current) =>
              current.filter((item) => item.id !== bookmark.id)
            )
          } else {
            removeLocalLaterBookmark(bookmark.id)
          }
        } else if (action === "read") {
          if (isPlus && readId) {
            await moveBookmarkToReadAction(bookmark.id, readId)
            setBookmarks((current) =>
              current.filter((item) => item.id !== bookmark.id)
            )
          } else {
            moveLocalBookmarkToRead(bookmark)
          }
        }
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : String(error))
      } finally {
        setPendingId(null)
      }
    })
  }

  if (!mounted && !isPlus) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="mt-4 font-label-md text-label-md text-muted-text">
          Loading Later...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">


      {listError && isPlus && (
        <div className="mb-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 font-label-md text-label-md text-error">
          {listError}
        </div>
      )}

      {actionError && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 font-label-md text-label-md text-error">
          <span className="flex-1">{actionError}</span>
          <Button
            onClick={() => setActionError(null)}
            variant="ghost"
            size="xs"
            className="text-error hover:bg-error/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 flex items-center gap-3 font-headline-xl text-headline-lg-mobile text-on-surface md:text-headline-xl">
            <CalendarClock
              aria-hidden="true"
              className="size-8 text-secondary md:size-10"
            />
            Later
          </h1>
          <p className="font-body-lg text-body-lg text-muted-text">
            Useful, but not urgent.
          </p>
        </div>

        <div className="flex w-fit items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-high px-4 py-2 font-label-md text-label-md text-on-surface">
          <Clock aria-hidden="true" className="size-5 text-secondary" />
          <span>
            Est. Reading Time: <strong>{estReadingTime} mins</strong>
          </span>
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-3 border-b border-outline-variant pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-muted-text">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Sort
          </span>
          {(Object.keys(sortLabels) as LaterSort[]).map((sortKey) => (
            <Link
              key={sortKey}
              href={buildUrl({ sort: sortKey === "oldest" ? null : sortKey })}
              className={cn(
                buttonVariants({ variant: "outline", size: "xs" }),
                "h-auto px-3 py-1.5 font-label-sm [font-size:12px] [line-height:16px]",
                sort === sortKey
                  ? "border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/10 hover:text-secondary"
                  : "border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              )}
            >
              {sortLabels[sortKey]}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-muted-text">
            <Filter aria-hidden="true" className="size-4" />
            Filter
          </span>
          {tag || source || readTime ? (
            <Link
              href={buildUrl({ tag: null, source: null, readTime: null })}
              className={cn(
                buttonVariants({ variant: "outline", size: "xs" }),
                "h-auto border-outline-variant bg-surface-container px-3 py-1.5 font-label-sm [font-size:12px] [line-height:16px] text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              )}
            >
              Clear filters
            </Link>
          ) : null}
          {tags.map((bookmarkTag) => (
            <Link
              key={bookmarkTag}
              href={buildUrl({ tag: bookmarkTag === tag ? null : bookmarkTag })}
              className={cn(
                buttonVariants({ variant: "outline", size: "xs" }),
                "h-auto px-3 py-1.5 font-label-sm [font-size:12px] [line-height:16px]",
                tag === bookmarkTag
                  ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                  : "border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              )}
            >
              #{bookmarkTag}
            </Link>
          ))}
          {sources.map((sourceName) => (
            <Link
              key={sourceName}
              href={buildUrl({
                source: sourceName === source ? null : sourceName,
              })}
              className={cn(
                buttonVariants({ variant: "outline", size: "xs" }),
                "h-auto px-3 py-1.5 font-label-sm [font-size:12px] [line-height:16px]",
                source === sourceName
                  ? "border-tertiary/30 bg-tertiary/10 text-tertiary hover:bg-tertiary/10 hover:text-tertiary"
                  : "border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              )}
            >
              {sourceName}
            </Link>
          ))}
          {[5, 10, 15].map((minutes) => (
            <Link
              key={minutes}
              href={buildUrl({
                readTime: readTime === String(minutes) ? null : String(minutes),
              })}
              className={cn(
                buttonVariants({ variant: "outline", size: "xs" }),
                "h-auto px-3 py-1.5 font-label-sm [font-size:12px] [line-height:16px]",
                readTime === String(minutes)
                  ? "border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/10 hover:text-secondary"
                  : "border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              )}
            >
              {"<="} {minutes}m
            </Link>
          ))}

          <div className="ml-auto shrink-0 font-label-sm text-label-sm text-muted-text">
            Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} of{" "}
            {totalItems}
            {totalItems !== bookmarks.length
              ? ` filtered from ${bookmarks.length}`
              : ""}
          </div>
        </div>
      </div>

      {visibleBookmarks.length === 0 ? (
        bookmarks.length === 0 ? (
          <EmptyLaterState />
        ) : (
          <NoLaterResults hasQuery={Boolean(query.trim())} />
        )
      ) : (
        <section className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
          {paginatedBookmarks.map((bookmark) => (
            <LaterArticleCard
              key={bookmark.id}
              bookmark={bookmark}
              isPending={isPending && pendingId === bookmark.id}
              onMoveToShortlist={() => runAction(bookmark, "shortlist")}
              onMarkAsRead={() => runAction(bookmark, "read")}
              onClearOut={() => runAction(bookmark, "clear")}
            />
          ))}
        </section>
      )}

      <Pagination
        currentPage={activePage}
        totalPages={totalPages}
        getPageUrl={getPageUrl}
        className="mt-auto"
      />
    </div>
  )
}

function NoLaterResults({ hasQuery }: { hasQuery: boolean }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-6 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-secondary/20 bg-secondary/10">
        <Filter aria-hidden="true" className="size-8 text-secondary" />
      </div>
      <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">
        No Matches
      </h2>
      <p className="max-w-[460px] font-body-lg text-body-lg text-muted-text">
        {hasQuery
          ? "Try clearing the search or choosing broader filters."
          : "Try clearing a filter or choosing a broader read-time range."}
      </p>
    </section>
  )
}

function LaterArticleCard({
  bookmark,
  isPending,
  onMoveToShortlist,
  onMarkAsRead,
  onClearOut,
}: {
  bookmark: ScoredBookmark
  isPending: boolean
  onMoveToShortlist: () => void
  onMarkAsRead: () => void
  onClearOut: () => void
}) {
  const sourceName = bookmark.source?.name || "Daily.dev"
  const readTimeStr = bookmark.readTime ? `${bookmark.readTime}m` : "Est: 5m"

  return (
    <article className="group flex min-w-0 flex-col gap-5 rounded-lg border border-outline-variant bg-surface-container-low p-5 sm:flex-row">
      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-secondary/10 bg-secondary/20 px-2 py-0.5 font-label-sm text-label-sm text-secondary uppercase">
              {sourceName}
            </span>
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-muted-text">
              <Clock aria-hidden="true" className="size-3.5" />
              {readTimeStr}
            </span>
          </div>

          <div className="flex items-center gap-1 rounded border border-outline-variant bg-surface-container-high px-2 py-1">
            <Zap aria-hidden="true" className="size-4 text-secondary" />
            <span className="font-label-md text-label-md font-bold text-secondary">
              {bookmark.score}
            </span>
          </div>
        </div>

        <h3 className="mb-2 font-headline-md text-headline-md text-on-surface transition-colors group-hover:text-secondary">
          <a href={bookmark.commentsPermalink} target="_blank" rel="noreferrer">
            {bookmark.title || "Untitled Article"}
          </a>
        </h3>

        <p className="mb-4 line-clamp-2 font-body-md text-body-md text-muted-text">
          {bookmark.summary ||
            "No description preview available for this bookmark."}
        </p>

        <div className="mb-4 flex flex-col gap-3">
          {bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {bookmark.tags.slice(0, 4).map((bookmarkTag) => (
                <span
                  key={bookmarkTag}
                  className="rounded border border-outline-variant/30 bg-surface-container px-2 py-0.5 font-label-sm text-[11px] leading-4 text-muted-text"
                >
                  #{bookmarkTag}
                </span>
              ))}
            </div>
          )}

          <div className="flex w-fit items-center gap-1.5 rounded border border-outline-variant/30 bg-surface-container/50 px-3 py-1.5 font-label-sm text-label-sm text-muted-text">
            <span className="text-base leading-none select-none">
              {bookmark.scoreEmoji}
            </span>
            <span>{bookmark.scoreExplanation}</span>
          </div>
        </div>

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
            onClick={onMoveToShortlist}
            disabled={isPending}
            className="h-auto gap-2 border-outline-variant bg-surface-container-highest px-4 py-2 font-label-md [font-size:14px] [line-height:20px] text-on-surface hover:bg-surface-variant"
            variant="outline"
          >
            <Star aria-hidden="true" className="size-4 text-primary" />
            Move to Shortlist
          </Button>
          <Button
            onClick={onMarkAsRead}
            disabled={isPending}
            className="h-auto gap-2 border-outline-variant bg-surface-container-highest px-4 py-2 font-label-md [font-size:14px] [line-height:20px] text-on-surface hover:bg-surface-variant"
            variant="outline"
          >
            <Check aria-hidden="true" className="size-4" />
            Mark as Read
          </Button>
          <Button
            onClick={onClearOut}
            disabled={isPending}
            className="h-auto gap-2 border-error/20 bg-error/10 px-4 py-2 font-label-md [font-size:14px] [line-height:20px] text-error hover:bg-error/20 hover:text-error"
            variant="destructive"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Clear Out
          </Button>
        </div>
      </div>
    </article>
  )
}

function EmptyLaterState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-6 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-secondary/20 bg-secondary/10">
        <MoveRight aria-hidden="true" className="size-8 text-secondary" />
      </div>
      <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">
        Later is Clear
      </h2>
      <p className="max-w-[460px] font-body-lg text-body-lg text-muted-text">
        Deferred reads will appear here after you send them from the triage
        loop.
      </p>
    </section>
  )
}
