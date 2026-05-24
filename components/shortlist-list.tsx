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
  SlidersHorizontal,
  Star,
  Trash2,
  Zap,
  Sparkles,
  X,
  Copy,
  CheckCircle2,
  Hammer,
} from "lucide-react"
import Link from "next/link"

import { Pagination } from "@/components/pagination"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  deleteBookmarkAction,
  generateProjectIdeaAction,
  moveBookmarkToLaterAction,
  moveBookmarkToReadAction,
} from "@/lib/actions"
import { matchesBookmarkSearch } from "@/lib/bookmark-search"
import { ProjectIdea, ProjectIdeaArticle } from "@/lib/inspiration"
import { calculatePriorityScores, ScoredBookmark } from "@/lib/scoring"
import { cn } from "@/lib/utils"

type ShortlistSort = "score" | "oldest" | "shortest"

interface ShortlistListProps {
  initialBookmarks: ScoredBookmark[]
  isPlus: boolean
  laterId: string | null
  readId: string | null
  listError: string | null
  sort: ShortlistSort
  currentPage: number
  tag: string
  source: string
  readTime: string
  query: string
}

const sortLabels: Record<ShortlistSort, string> = {
  score: "Highest score",
  oldest: "Oldest first",
  shortest: "Shortest read",
}

export function ShortlistList({
  initialBookmarks,
  isPlus,
  laterId,
  readId,
  listError,
  sort,
  currentPage,
  tag,
  source,
  readTime,
  query,
}: ShortlistListProps) {
  const [mounted, setMounted] = useState(false)
  const [bookmarks, setBookmarks] = useState<ScoredBookmark[]>(initialBookmarks)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Zustand Store selectors
  const localShortlist = useKansoStore((state) => state.localShortlist)
  const removeFromLocalShortlist = useKansoStore(
    (state) => state.removeFromLocalShortlist
  )
  const addToLocalLater = useKansoStore((state) => state.addToLocalLater)
  const addToLocalRead = useKansoStore((state) => state.addToLocalRead)
  const scoringSettings = useScoringStore((state) => state.settings)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)

      if (!isPlus) {
        setBookmarks(calculatePriorityScores(localShortlist, scoringSettings))
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [isPlus, localShortlist, scoringSettings])

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
      if (sort === "oldest") {
        return (
          new Date(a.bookmarkedAt || a.createdAt).getTime() -
          new Date(b.bookmarkedAt || b.createdAt).getTime()
        )
      }
      if (sort === "shortest") return (a.readTime || 5) - (b.readTime || 5)
      return b.score - a.score
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
    if (sort !== "score") params.set("sort", sort)
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
    return queryString ? `/shortlist?${queryString}` : "/shortlist"
  }

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (sort !== "score") params.set("sort", sort)
    if (tag) params.set("tag", tag)
    if (source) params.set("source", source)
    if (readTime) params.set("readTime", readTime)
    if (query) params.set("q", query)
    params.set("page", page.toString())
    return `/shortlist?${params.toString()}`
  }

  const removeLocalShortlistBookmark = (bookmarkId: string) => {
    removeFromLocalShortlist(bookmarkId)
    setBookmarks((current) => current.filter((b) => b.id !== bookmarkId))
  }

  const moveLocalBookmarkToList = (
    bookmark: ScoredBookmark,
    listKey: "later" | "read"
  ) => {
    if (listKey === "later") {
      addToLocalLater(bookmark)
    } else {
      addToLocalRead(bookmark)
    }
    removeLocalShortlistBookmark(bookmark.id)
  }

  const runAction = (
    bookmark: ScoredBookmark,
    action: "later" | "read" | "clear"
  ) => {
    setPendingId(bookmark.id)
    setActionError(null)

    startTransition(async () => {
      try {
        if (action === "later") {
          if (isPlus && laterId) {
            await moveBookmarkToLaterAction(bookmark.id, laterId)
            setBookmarks((current) =>
              current.filter((item) => item.id !== bookmark.id)
            )
          } else {
            moveLocalBookmarkToList(bookmark, "later")
          }
        } else if (action === "read") {
          if (isPlus && readId) {
            await moveBookmarkToReadAction(bookmark.id, readId)
            setBookmarks((current) =>
              current.filter((item) => item.id !== bookmark.id)
            )
          } else {
            moveLocalBookmarkToList(bookmark, "read")
          }
        } else if (action === "clear") {
          if (isPlus) {
            await deleteBookmarkAction(bookmark.id)
            setBookmarks((current) =>
              current.filter((item) => item.id !== bookmark.id)
            )
          } else {
            removeLocalShortlistBookmark(bookmark.id)
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
          Loading Shortlist...
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
            <Star
              aria-hidden="true"
              className="size-8 fill-primary text-primary md:size-10"
            />
            Shortlist
          </h1>
          <p className="font-body-lg text-body-lg text-muted-text">
            High-priority reading material sorted by relevance score.
          </p>
        </div>

        <div className="flex w-fit items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-high px-4 py-2 font-label-md text-label-md text-on-surface">
          <Clock aria-hidden="true" className="size-5 text-secondary" />
          <span>
            Est. Reading Time: <strong>{estReadingTime} mins</strong>
          </span>
        </div>
      </header>

      {bookmarks.length > 10 && (
        <section className="mb-8 flex items-start gap-4 rounded-lg border border-error/30 bg-error/10 p-4">
          <Star
            aria-hidden="true"
            className="mt-0.5 size-5 fill-error text-error"
          />
          <div className="flex-1">
            <h2 className="mb-1 font-headline-md text-headline-md text-error">
              Shortlist Discipline
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Shortlist is at{" "}
              <strong className="text-error">{bookmarks.length}/10</strong>{" "}
              items. Move a few to Later or Read to keep the list sharp.
            </p>
          </div>
        </section>
      )}

      <div className="mb-6 flex flex-col gap-3 border-b border-outline-variant pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-muted-text">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Sort
          </span>
          {(Object.keys(sortLabels) as ShortlistSort[]).map((sortKey) => (
            <Link
              key={sortKey}
              href={buildUrl({ sort: sortKey === "score" ? null : sortKey })}
              className={cn(
                buttonVariants({ variant: "outline", size: "xs" }),
                "h-auto px-3 py-1.5 font-label-sm [font-size:12px] [line-height:16px]",
                sort === sortKey
                  ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
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
          <EmptyShortlistState />
        ) : (
          <NoShortlistResults hasQuery={Boolean(query.trim())} />
        )
      ) : (
        <section className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
          {paginatedBookmarks.map((bookmark) => (
            <ShortlistArticleCard
              key={bookmark.id}
              bookmark={bookmark}
              isPending={isPending && pendingId === bookmark.id}
              onMoveToLater={() => runAction(bookmark, "later")}
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

function NoShortlistResults({ hasQuery }: { hasQuery: boolean }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-6 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
        <Filter aria-hidden="true" className="size-8 text-primary" />
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

function ShortlistArticleCard({
  bookmark,
  isPending,
  onMoveToLater,
  onMarkAsRead,
  onClearOut,
}: {
  bookmark: ScoredBookmark
  isPending: boolean
  onMoveToLater: () => void
  onMarkAsRead: () => void
  onClearOut: () => void
}) {
  const sourceName = bookmark.source?.name || "Daily.dev"
  const readTimeStr = bookmark.readTime ? `${bookmark.readTime}m` : "Est: 5m"

  const [isGenerating, setIsGenerating] = useState(false)
  const [idea, setIdea] = useState<ProjectIdea | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleGenerateIdea = async () => {
    setIsModalOpen(true)
    setIsGenerating(true)
    setError(null)

    try {
      const articleContext: ProjectIdeaArticle[] = [
        {
          title: bookmark.title || "Untitled article",
          summary: bookmark.summary || "No description preview available.",
          source: bookmark.source?.name || "Daily.dev",
          tags: bookmark.tags || [],
          url: bookmark.url || bookmark.commentsPermalink,
        },
      ]

      const nextIdea = await generateProjectIdeaAction(articleContext)
      setIdea(nextIdea)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <article className="group flex min-w-0 flex-col gap-5 rounded-lg border border-outline-variant bg-surface-container-low p-5 sm:flex-row">
      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-primary/10 bg-primary/20 px-2 py-0.5 font-label-sm text-label-sm text-primary uppercase">
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

        <h3 className="mb-2 font-headline-md text-headline-md text-on-surface transition-colors group-hover:text-primary">
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
            onClick={handleGenerateIdea}
            disabled={isPending}
            className="h-auto gap-2 border-primary/20 bg-primary/5 px-4 py-2 font-label-md [font-size:14px] [line-height:20px] text-primary hover:bg-primary/10"
            variant="outline"
          >
            <Sparkles aria-hidden="true" className="size-4" />
            Inspire
          </Button>
          <Button
            onClick={onMoveToLater}
            disabled={isPending}
            className="h-auto gap-2 border-outline-variant bg-surface-container-highest px-4 py-2 font-label-md [font-size:14px] [line-height:20px] text-on-surface hover:bg-surface-variant"
            variant="outline"
          >
            <CalendarClock
              aria-hidden="true"
              className="size-4 text-secondary"
            />
            Move to Later
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

      <InspirationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        articleTitle={bookmark.title || "Untitled article"}
        isGenerating={isGenerating}
        idea={idea}
        error={error}
        onRetry={handleGenerateIdea}
        bookmark={bookmark}
      />
    </article>
  )
}

function InspirationModal({
  isOpen,
  onClose,
  articleTitle,
  isGenerating,
  idea,
  error,
  onRetry,
  bookmark,
}: {
  isOpen: boolean
  onClose: () => void
  articleTitle: string
  isGenerating: boolean
  idea: ProjectIdea | null
  error: string | null
  onRetry: () => void
  bookmark: ScoredBookmark
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    if (!idea) return
    const text = `### ${idea.title}

**Pitch:** ${idea.pitch}

**Why Now:** ${idea.whyNow}

**MVP Steps:**
${idea.mvp.map((step) => `- ${step}`).join("\n")}

**Tech Stack:**
${idea.stack.map((tool) => `- ${tool}`).join("\n")}

*Inspired by: [${articleTitle}](${bookmark.url || bookmark.commentsPermalink})*`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-xl border border-outline-variant bg-surface-container-low p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-muted-text hover:bg-surface-container-high hover:text-on-surface transition-colors"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="size-10 animate-spin text-primary mb-4" />
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
              Brainstorming project ideas...
            </h3>
            <p className="font-body-md text-body-md text-muted-text max-w-md">
              Analyzing &ldquo;{articleTitle}&rdquo; to generate a buildable, high-value project concept.
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-error/10 text-error">
              <span className="text-xl">⚠️</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-error mb-2">
              Failed to generate idea
            </h3>
            <p className="font-body-md text-body-md text-muted-text max-w-md mb-6">
              {error}
            </p>
            <Button onClick={onRetry} variant="default" className="gap-2">
              Try Again
            </Button>
          </div>
        ) : idea ? (
          <div className="flex flex-col">
            <div className="mb-4 flex flex-wrap items-center gap-2 pr-8">
              <span className="flex items-center gap-1.5 font-label-sm text-[12px] text-secondary uppercase font-bold">
                <Sparkles className="size-4" />
                Single-Article Spark
              </span>
            </div>

            <h3 className="mb-2 font-headline-xl text-headline-lg text-primary">
              {idea.title}
            </h3>

            <p className="font-body-lg text-body-lg text-on-surface mb-4">
              {idea.pitch}
            </p>

            <div className="mb-6 rounded-lg border border-outline-variant/30 bg-surface-container/50 p-4">
              <h4 className="mb-1 font-label-md text-label-md text-on-surface font-bold">
                Why Now?
              </h4>
              <p className="font-body-md text-body-md text-muted-text">
                {idea.whyNow}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 mb-6">
              {idea.mvp.length > 0 && (
                <div className="rounded-lg border border-outline-variant bg-surface-container p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-label-md text-label-md text-on-surface font-bold">
                    <CheckCircle2 className="size-4 text-secondary" />
                    MVP Steps
                  </h4>
                  <ul className="space-y-2 font-body-md text-body-md text-muted-text">
                    {idea.mvp.map((step) => (
                      <li key={step} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-secondary" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {idea.stack.length > 0 && (
                <div className="rounded-lg border border-outline-variant bg-surface-container p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-label-md text-label-md text-on-surface font-bold">
                    <Hammer className="size-4 text-tertiary" />
                    Recommended Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {idea.stack.map((tool) => (
                      <span
                        key={tool}
                        className="rounded border border-tertiary/20 bg-tertiary/10 px-2 py-1 font-label-sm text-[11px] leading-4 text-tertiary font-mono"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {idea.articleConnections.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-2 font-label-sm text-[11px] text-muted-text uppercase font-bold tracking-wider">
                  Article Connections
                </h4>
                <div className="flex flex-wrap gap-2">
                  {idea.articleConnections.map((connection) => (
                    <span
                      key={connection}
                      className="rounded border border-outline-variant/40 bg-surface-container px-2.5 py-1 font-label-sm text-[11px] leading-4 text-on-surface-variant"
                    >
                      {connection}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 border-t border-outline-variant pt-4">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="gap-2 border-outline-variant bg-surface-container-highest px-4 py-2 font-label-md [font-size:14px] [line-height:20px] text-on-surface hover:bg-surface-variant"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-secondary" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy Idea
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="default"
                className="ml-auto px-5 py-2 font-label-md [font-size:14px] [line-height:20px]"
              >
                Done
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function EmptyShortlistState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-6 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
        <Star aria-hidden="true" className="size-8 fill-primary text-primary" />
      </div>
      <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">
        Shortlist is Empty
      </h2>
      <p className="max-w-[460px] font-body-lg text-body-lg text-muted-text">
        High-priority reads will appear here after you send them from the triage
        loop.
      </p>
    </section>
  )
}
