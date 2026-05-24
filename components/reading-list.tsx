"use client"

import { useMemo, useState, useTransition } from "react"
import { useKansoStore } from "@/hooks/use-kanso-store"
import {
  AlertTriangle,
  Bookmark,
  Clock3,
  Filter,
  SlidersHorizontal,
} from "lucide-react"
import Link from "next/link"

import { BookmarkCard } from "@/components/bookmark-card"
import { Pagination } from "@/components/pagination"
import { Button, buttonVariants } from "@/components/ui/button"
import { moveBookmarkToReadAction } from "@/lib/actions"
import { matchesBookmarkSearch } from "@/lib/bookmark-search"
import { ScoredBookmark } from "@/lib/scoring"
import { cn } from "@/lib/utils"

type ReadingListSort = "score" | "oldest" | "shortest"

interface ReadingListProps {
  initialBookmarks: ScoredBookmark[]
  isPlus: boolean
  readId: string | null
  listError: string | null
  sort: ReadingListSort
  currentPage: number
  tag: string
  source: string
  readTime: string
  query: string
}

const sortLabels: Record<ReadingListSort, string> = {
  score: "Highest score",
  oldest: "Oldest first",
  shortest: "Shortest read",
}

const INBOX_PATH = "/inbox"

export function ReadingList({
  initialBookmarks,
  isPlus,
  readId,
  listError,
  sort,
  currentPage,
  tag,
  source,
  readTime,
  query,
}: ReadingListProps) {
  const [bookmarks, setBookmarks] = useState<ScoredBookmark[]>(initialBookmarks)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Zustand Store selectors
  const addToLocalRead = useKansoStore((state) => state.addToLocalRead)

  const totalCount = bookmarks.length

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
    return queryString ? `${INBOX_PATH}?${queryString}` : INBOX_PATH
  }

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (sort !== "score") params.set("sort", sort)
    if (tag) params.set("tag", tag)
    if (source) params.set("source", source)
    if (readTime) params.set("readTime", readTime)
    if (query) params.set("q", query)
    params.set("page", page.toString())
    return `${INBOX_PATH}?${params.toString()}`
  }

  const moveLocalBookmarkToRead = (bookmark: ScoredBookmark) => {
    addToLocalRead(bookmark)
    setBookmarks((current) => current.filter((item) => item.id !== bookmark.id))
  }

  const markAsRead = (bookmark: ScoredBookmark) => {
    setPendingId(bookmark.id)
    setActionError(null)

    startTransition(async () => {
      try {
        if (isPlus && readId) {
          await moveBookmarkToReadAction(bookmark.id, readId)
          setBookmarks((current) =>
            current.filter((item) => item.id !== bookmark.id)
          )
        } else {
          moveLocalBookmarkToRead(bookmark)
        }
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : String(error))
      } finally {
        setPendingId(null)
      }
    })
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
            <Bookmark
              aria-hidden="true"
              className="size-8 text-primary md:size-10"
              fill="currentColor"
            />
            Inbox
          </h1>
          <p className="font-body-lg text-body-lg text-muted-text">
            Your live Daily.dev unread inbox bookmarks prioritised by AI
            scoring.
          </p>
        </div>

        <div className="flex w-fit items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-high px-4 py-2 font-label-md text-label-md text-on-surface">
          <Clock3 aria-hidden="true" className="size-5 text-secondary" />
          <span>
            Est. Reading Time: <strong>{estReadingTime} mins</strong>
          </span>
        </div>
      </header>

      {totalCount > 20 && (
        <section className="mb-8 flex items-start gap-4 rounded-lg border border-error/30 bg-error/10 p-4">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-5 text-error"
          />
          <div className="flex-1">
            <h2 className="mb-1 font-headline-md text-headline-md text-error">
              Inbox Overload
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Your inbox has{" "}
              <strong className="text-error">{totalCount}</strong> unread
              bookmarks. Consider triaging items using the one-card loop to
              reclaim focus.
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
          {(Object.keys(sortLabels) as ReadingListSort[]).map((sortKey) => (
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
            {totalItems !== totalCount ? ` filtered from ${totalCount}` : ""}
          </div>
        </div>
      </div>

      {totalItems === 0 ? (
        bookmarks.length === 0 ? (
          <EmptyState />
        ) : (
          <NoFilteredResults hasQuery={Boolean(query.trim())} />
        )
      ) : (
        <section className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
          {paginatedBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              className="min-w-0"
              isPending={isPending && pendingId === bookmark.id}
              onMarkAsRead={() => markAsRead(bookmark)}
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

function NoFilteredResults({ hasQuery }: { hasQuery: boolean }) {
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

function EmptyState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-6 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
        <Bookmark aria-hidden="true" className="size-8 text-primary" />
      </div>
      <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">
        Your Inbox is Empty!
      </h2>
      <p className="max-w-[460px] font-body-lg text-body-lg text-muted-text">
        Excellent work! You have cleared all your unread bookmarks. Save some
        new content on Daily.dev or sync again to import fresh articles.
      </p>
    </section>
  )
}
