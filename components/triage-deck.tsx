"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useKansoStore } from "@/hooks/use-kanso-store"
import { useScoringStore } from "@/hooks/use-scoring-store"
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Star,
  Trash2,
  Zap,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ScoredBookmark, calculatePriorityScores } from "@/lib/scoring"
import { Profile, BookmarkedPost } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  moveBookmarkToShortlistAction,
  moveBookmarkToLaterAction,
  deleteBookmarkAction,
  addBookmarkAction,
  removeBookmarkFromListAction,
} from "@/lib/actions"

interface TriageDeckProps {
  initialBookmarks: BookmarkedPost[]
  profile: Profile | null
  initialShortlistId: string | null
  initialLaterId: string | null
  isPlus: boolean
  listError: string | null
}

interface UndoAction {
  bookmark: ScoredBookmark
  actionType: TriageActionType
}

const MAX_SESSION_TARGET = 20

type TriageActionType = "shortlist" | "later" | "clear" | "skip"
type CountKey = keyof TriageCounts

interface TriageCounts {
  shortlist: number
  later: number
  cleared: number
  skipped: number
}

const INITIAL_COUNTS: TriageCounts = {
  shortlist: 0,
  later: 0,
  cleared: 0,
  skipped: 0,
}

function getCountKey(actionType: TriageActionType): CountKey {
  if (actionType === "clear") return "cleared"
  if (actionType === "skip") return "skipped"
  return actionType
}

export function TriageDeck({
  initialBookmarks,
  initialShortlistId,
  initialLaterId,
  isPlus: initialIsPlus,
}: TriageDeckProps) {
  const [mounted, setMounted] = useState(false)
  const [sessionBookmarks, setSessionBookmarks] = useState(initialBookmarks)
  const [sessionTotal, setSessionTotal] = useState(initialBookmarks.length)
  const scoringSettings = useScoringStore((state) => state.settings)

  // Zustand Store selectors
  const processedIds = useKansoStore((state) => state.processedIds)
  const trackProcessedId = useKansoStore((state) => state.trackProcessedId)
  const untrackProcessedId = useKansoStore((state) => state.untrackProcessedId)
  const addToLocalShortlist = useKansoStore((state) => state.addToLocalShortlist)
  const removeFromLocalShortlist = useKansoStore((state) => state.removeFromLocalShortlist)
  const addToLocalLater = useKansoStore((state) => state.addToLocalLater)
  const removeFromLocalLater = useKansoStore((state) => state.removeFromLocalLater)
  const clearAllLocalData = useKansoStore((state) => state.clearAllLocalData)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSessionTotal(
        sessionBookmarks.filter((b) => !processedIds.includes(b.id)).length
      )
      setMounted(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [sessionBookmarks, processedIds])

  const [counts, setCounts] = useState<TriageCounts>(INITIAL_COUNTS)

  // Action / Undo history
  const [history, setHistory] = useState<UndoAction[]>([])
  const [undoToast, setUndoToast] = useState<{
    visible: boolean
    message: string
    action: UndoAction
  } | null>(null)

  // Plus account check (can be overwritten if lists API fails)
  const [isPlus] = useState(
    initialIsPlus && !!initialShortlistId && !!initialLaterId
  )

  // Navigation / Animation states
  const [animatingDirection, setAnimatingDirection] = useState<
    "shortlist" | "later" | "clear" | "skip" | null
  >(null)

  const [showGoalModal, setShowGoalModal] = useState(false)
  const [userDismissedGoal, setUserDismissedGoal] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Timer reference for toast auto-dismiss
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingActionsRef = useRef<Map<string, Promise<void>>>(new Map())

  // Compute active deck dynamically on the client after mount to prevent hydration mismatch
  const deck = useMemo(() => {
    const processedIdSet = new Set(processedIds)
    const activeBookmarks = sessionBookmarks.filter(
      (b) => !processedIdSet.has(b.id)
    )
    return calculatePriorityScores(activeBookmarks, scoringSettings)
  }, [sessionBookmarks, processedIds, scoringSettings])

  // Track session progress decisions count
  const decisionsCount =
    counts.shortlist + counts.later + counts.cleared + counts.skipped
  const sessionTarget = Math.min(MAX_SESSION_TARGET, sessionTotal)

  // Note: Goal modal triggers directly in setCounts updater to avoid set-state-in-effect

  // Process bookmark local storage tracking (for free tier simulation)
  const trackProcessedLocally = useCallback((id: string) => {
    trackProcessedId(id)
  }, [trackProcessedId])

  const untrackProcessedLocally = useCallback((id: string) => {
    untrackProcessedId(id)
  }, [untrackProcessedId])

  // Execute client-side list simulation for free users
  const saveToLocalList = useCallback(
    (bookmark: ScoredBookmark, listKey: "shortlist" | "later") => {
      if (listKey === "shortlist") {
        addToLocalShortlist(bookmark)
      } else {
        addToLocalLater(bookmark)
      }
    },
    [addToLocalShortlist, addToLocalLater]
  )

  const removeFromLocalList = useCallback(
    (id: string, listKey: "shortlist" | "later") => {
      if (listKey === "shortlist") {
        removeFromLocalShortlist(id)
      } else {
        removeFromLocalLater(id)
      }
    },
    [removeFromLocalShortlist, removeFromLocalLater]
  )

  // Core Triage Decision handler
  const handleDecision = useCallback(
    async (actionType: TriageActionType) => {
      if (deck.length === 0 || animatingDirection !== null) return

      const activeBookmark = deck[0]
      const countKey = getCountKey(actionType)

      // Trigger card swipe animation
      setAnimatingDirection(actionType)
      setActionError(null)

      // Store in history for Undo
      const newHistoryItem: UndoAction = {
        bookmark: activeBookmark,
        actionType,
      }

      // Optimistic updates (wait for animation transition before changing card)
      setTimeout(async () => {
        // Increment count & index
        setCounts((prev) => {
          const nextCounts = {
            ...prev,
            [countKey]: prev[countKey] + 1,
          }
          const totalDecisions =
            nextCounts.shortlist +
            nextCounts.later +
            nextCounts.cleared +
            nextCounts.skipped
          if (
            sessionTarget === MAX_SESSION_TARGET &&
            totalDecisions >= sessionTarget &&
            !userDismissedGoal
          ) {
            setShowGoalModal(true)
          }
          return nextCounts
        })
        trackProcessedLocally(activeBookmark.id)
        setAnimatingDirection(null)

        // Show undo toast
        let toastMsg = ""
        if (actionType === "shortlist")
          toastMsg = `Shortlisted "${activeBookmark.title}"`
        else if (actionType === "later")
          toastMsg = `Deferred "${activeBookmark.title}" to Later`
        else if (actionType === "clear")
          toastMsg = `Cleared "${activeBookmark.title}"`
        else if (actionType === "skip")
          toastMsg = `Skipped "${activeBookmark.title}"`

        setHistory((prev) => [...prev, newHistoryItem])
        setUndoToast({
          visible: true,
          message: toastMsg,
          action: newHistoryItem,
        })

        // Auto-dismiss undo toast after 5 seconds
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        toastTimerRef.current = setTimeout(() => {
          setUndoToast(null)
        }, 5000)

        // Execute API calls in background
        const actionPromise = (async () => {
          if (actionType === "shortlist") {
            if (isPlus && initialShortlistId) {
              await moveBookmarkToShortlistAction(
                activeBookmark.id,
                initialShortlistId
              )
            } else {
              saveToLocalList(activeBookmark, "shortlist")
            }
          } else if (actionType === "later") {
            if (isPlus && initialLaterId) {
              await moveBookmarkToLaterAction(activeBookmark.id, initialLaterId)
            } else {
              saveToLocalList(activeBookmark, "later")
            }
          } else if (actionType === "clear") {
            // Everyone can unbookmark (delete)
            await deleteBookmarkAction(activeBookmark.id)
          }
        })()

        pendingActionsRef.current.set(activeBookmark.id, actionPromise)

        try {
          await actionPromise
        } catch (error: unknown) {
          const errorMsg =
            error instanceof Error ? error.message : String(error)
          console.error(`Failed to execute ${actionType} API action:`, error)
          setActionError(`Failed to sync action with Daily.dev: ${errorMsg}`)

          // Revert client state on failure
          setCounts((prev) => ({
            ...prev,
            [countKey]: Math.max(0, prev[countKey] - 1),
          }))
          setHistory((prev) => prev.filter((item) => item !== newHistoryItem))
          untrackProcessedLocally(activeBookmark.id)
          if (actionType === "shortlist")
            removeFromLocalList(activeBookmark.id, "shortlist")
          else if (actionType === "later")
            removeFromLocalList(activeBookmark.id, "later")
        } finally {
          if (
            pendingActionsRef.current.get(activeBookmark.id) === actionPromise
          ) {
            pendingActionsRef.current.delete(activeBookmark.id)
          }
        }
      }, 200)
    },
    [
      deck,
      animatingDirection,
      isPlus,
      initialShortlistId,
      initialLaterId,
      trackProcessedLocally,
      untrackProcessedLocally,
      saveToLocalList,
      removeFromLocalList,
      sessionTarget,
      userDismissedGoal,
    ]
  )

  // Undo implementation
  const handleUndo = useCallback(async () => {
    if (history.length === 0) return

    const lastAction = history[history.length - 1]
    const { bookmark, actionType } = lastAction
    const countKey = getCountKey(actionType)
    const pendingAction = pendingActionsRef.current.get(bookmark.id)

    // Reset toast & error
    setUndoToast(null)
    setActionError(null)

    if (pendingAction) {
      try {
        await pendingAction
      } catch {
        return
      }
    }

    // Revert state locally
    setCounts((prev) => ({
      ...prev,
      [countKey]: Math.max(0, prev[countKey] - 1),
    }))
    setHistory((prev) => prev.slice(0, -1))
    untrackProcessedLocally(bookmark.id)

    // Remove from simulated lists if applicable
    if (!isPlus) {
      if (actionType === "shortlist")
        removeFromLocalList(bookmark.id, "shortlist")
      else if (actionType === "later") removeFromLocalList(bookmark.id, "later")
    }

    // Call API to reverse the action
    try {
      if (actionType === "clear") {
        // Deleted bookmark -> add it back
        await addBookmarkAction(bookmark.id)
      } else if (actionType === "shortlist" || actionType === "later") {
        if (isPlus) {
          // Moved to list -> remove from list (moves back to general unread)
          await removeBookmarkFromListAction(bookmark.id)
        }
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error("Failed to undo API action:", error)
      setActionError(`Undo failed to sync with Daily.dev: ${errorMsg}`)

      // If API undo fails, force client state back to processed
      setCounts((prev) => ({
        ...prev,
        [countKey]: prev[countKey] + 1,
      }))
      trackProcessedLocally(bookmark.id)
      if (!isPlus) {
        if (actionType === "shortlist") saveToLocalList(bookmark, "shortlist")
        else if (actionType === "later") saveToLocalList(bookmark, "later")
      }
    }
  }, [
    history,
    isPlus,
    untrackProcessedLocally,
    trackProcessedLocally,
    saveToLocalList,
    removeFromLocalList,
  ])

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if the user is typing in form inputs/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      // Check for modifier keys to avoid overriding browser defaults
      const hasModifiers = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey

      if (
        e.key.toLowerCase() === "z" ||
        (e.ctrlKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault()
        handleUndo()
        return
      }

      if (hasModifiers) return

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault()
          handleDecision("shortlist")
          break
        case "l":
          e.preventDefault()
          handleDecision("later")
          break
        case "d":
        case "delete":
        case "backspace":
          e.preventDefault()
          handleDecision("clear")
          break
        case " ":
        case "arrowright":
          e.preventDefault()
          handleDecision("skip")
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleDecision, handleUndo])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  // Loading indicator until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="mt-4 font-label-md text-label-md text-muted-text">
          Loading unread backlog...
        </p>
      </div>
    )
  }

  const activeCard = deck.length > 0 ? deck[0] : null
  const nextCard = deck.length > 1 ? deck[1] : null
  const isDeckEmpty = deck.length === 0

  return (
    <div className="flex flex-1 flex-col">
      {/* Top Banner for Free Accounts */}
      {!isPlus && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-outline/30 bg-surface-container-high/50 px-4 py-3 text-label-md text-on-surface">
          <ShieldAlert
            aria-hidden="true"
            className="size-5 shrink-0 text-secondary"
          />
          <span className="flex-1">
            <strong>Daily.dev Free Tier:</strong> Bookmark lists are Plus
            features. We will simulate{" "}
            <span className="font-bold text-primary">Shortlist</span> and{" "}
            <span className="font-bold text-secondary">Later</span> lists
            locally on this browser.
          </span>
        </div>
      )}

      {/* Sync Error Indicator */}
      {actionError && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-label-md text-error">
          <ShieldAlert aria-hidden="true" className="size-5 shrink-0" />
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

      {/* Triage Dashboard Header */}
      <section className="mb-8 flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between font-label-md text-label-md">
            <span className="text-muted-text">Session Progress</span>
            <span className="text-on-surface">
              <strong>{decisionsCount}</strong> / {sessionTarget} decisions
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{
                width:
                  sessionTarget > 0
                    ? `${Math.min(100, (decisionsCount / sessionTarget) * 100)}%`
                    : "0%",
              }}
            />
          </div>
        </div>

        {/* Action Tally Stats */}
        <div className="flex shrink-0 flex-wrap items-center gap-3 md:ml-6">
          <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 font-label-sm text-label-sm text-on-surface">
            <Star className="size-3.5 fill-primary text-primary" />
            <span>
              Shortlist:{" "}
              <strong className="text-primary">{counts.shortlist}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 font-label-sm text-label-sm text-on-surface">
            <CalendarClock className="size-3.5 text-secondary" />
            <span>
              Later: <strong className="text-secondary">{counts.later}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 font-label-sm text-label-sm text-on-surface">
            <Trash2 className="size-3.5 text-error" />
            <span>
              Cleared: <strong className="text-error">{counts.cleared}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 font-label-sm text-label-sm text-on-surface">
            <ArrowRight className="size-3.5 text-muted-text" />
            <span>
              Skipped:{" "}
              <strong className="text-muted-text">{counts.skipped}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Main Deck Stack Area */}
      <div className="relative mx-auto flex w-full max-w-[860px] flex-1 flex-col items-center justify-center py-6">
        {isDeckEmpty ? (
          /* Empty / Complete State */
          <div className="flex w-full flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center shadow-lg">
            <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-secondary/20 bg-secondary/10">
              <CheckCircle2
                aria-hidden="true"
                className="size-8 text-secondary"
              />
            </div>
            <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">
              Inbox Fully Triaged! 🏆
            </h2>
            <p className="mb-6 max-w-[450px] font-body-lg text-body-md text-muted-text">
              Fantastic work! You have processed all bookmarks in your inbox. No
              residual backlog guilt.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/"
                className="rounded-lg bg-primary px-6 py-3 font-label-md text-label-md font-bold text-primary-foreground transition-colors hover:bg-primary/95"
              >
                Back to Inbox
              </Link>
              <Button
                onClick={() => {
                  clearAllLocalData()
                  setSessionBookmarks(initialBookmarks)
                  setSessionTotal(initialBookmarks.length)
                  setCounts(INITIAL_COUNTS)
                  setHistory([])
                }}
                variant="outline"
                className="h-auto border-outline-variant bg-surface-container-highest px-6 py-3 font-label-md text-label-md text-on-surface hover:bg-surface-variant"
              >
                Start Over
              </Button>
            </div>
          </div>
        ) : (
          /* Bookmark Card Stack */
          <div className="relative h-[540px] w-full md:h-[560px]">
            {/* Background Card Preview */}
            {nextCard && (
              <div className="pointer-events-none absolute inset-x-3 top-3 -z-10 h-full scale-[0.97] rounded-xl border border-outline-variant bg-surface-container-low/40 p-5 opacity-40 blur-[0.5px] transition-all duration-300 select-none" />
            )}

            {/* Active Triage Card */}
            {activeCard && (
              <article
                className={cn(
                  "absolute inset-0 z-10 flex h-full transform flex-col rounded-xl border border-outline bg-surface-container-low p-6 shadow-xl transition-all duration-300 ease-out md:p-8",
                  animatingDirection === "shortlist" &&
                  "translate-x-[115%] scale-95 rotate-12 opacity-0",
                  animatingDirection === "clear" &&
                  "translate-x-[-115%] scale-95 -rotate-12 opacity-0",
                  animatingDirection === "later" &&
                  "translate-y-[-115%] scale-95 opacity-0",
                  animatingDirection === "skip" &&
                  "translate-y-3 scale-90 opacity-0"
                )}
              >
                {/* Meta details & Score */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-primary/10 bg-primary/20 px-2.5 py-0.5 font-label-sm text-label-sm text-primary uppercase">
                      {activeCard.source?.name || "Daily.dev"}
                    </span>
                    <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-muted-text">
                      <Clock aria-hidden="true" className="size-3.5" />
                      {activeCard.readTime
                        ? `${activeCard.readTime} min`
                        : "Est: 5 min"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 rounded border border-outline-variant bg-surface-container-high px-2 py-1">
                    <Zap
                      aria-hidden="true"
                      className="size-4 fill-secondary text-secondary"
                    />
                    <span className="font-label-md text-label-md font-bold text-secondary">
                      {activeCard.score}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="mb-4 line-clamp-3 font-headline-md text-headline-md leading-tight text-on-surface transition-colors hover:text-primary md:text-headline-lg">
                  <a
                    href={activeCard.commentsPermalink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {activeCard.title || "Untitled Bookmark"}
                  </a>
                </h3>

                {/* Summary snippet */}
                <p className="mb-5 line-clamp-5 flex-1 font-body-md text-body-md text-muted-text">
                  {activeCard.summary ||
                    "No description preview available for this bookmark."}
                </p>

                {/* Tags and Scoring explanation */}
                <div className="mb-6 flex flex-col gap-3">
                  {/* Tags list */}
                  {activeCard.tags && activeCard.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeCard.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-outline-variant/30 bg-surface-container px-2 py-0.5 font-label-sm text-[11px] leading-4 text-muted-text"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Scoring justification */}
                  <div className="flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-high/40 px-3 py-2 font-label-sm text-label-sm text-muted-text">
                    <span className="text-base leading-none select-none">
                      {activeCard.scoreEmoji}
                    </span>
                    <span>{activeCard.scoreExplanation}</span>
                  </div>
                </div>

                {/* Card footer (hotkey labels helper) */}
                <div className="mt-auto flex items-center justify-between border-t border-outline-variant pt-4 text-label-sm text-muted-text">
                  <span>
                    Created{" "}
                    {new Date(activeCard.createdAt).toLocaleDateString()}
                  </span>
                  <span className="hidden sm:inline">
                    Use keyboard shortcuts below or click actions
                  </span>
                </div>
              </article>
            )}
          </div>
        )}
      </div>

      {/* Control Action Buttons Bar */}
      {!isDeckEmpty && (
        <section className="mx-auto mt-6 flex w-full max-w-[860px] flex-wrap items-center justify-center gap-3 px-4">
          <Button
            onClick={() => handleDecision("clear")}
            disabled={animatingDirection !== null}
            variant="outline"
            className="h-auto min-w-[120px] flex-1 gap-2 rounded-lg border-error/20 bg-error/10 px-4 py-3.5 font-label-md text-label-md text-error transition-all hover:bg-error/20 hover:text-error active:scale-[0.98]"
          >
            <Trash2 className="size-4 shrink-0" />
            <span>Clear Out</span>
            <kbd className="ml-auto hidden border-error/20 bg-error/20 text-error md:block">
              D
            </kbd>
          </Button>

          <Button
            onClick={() => handleDecision("later")}
            disabled={animatingDirection !== null}
            variant="outline"
            className="h-auto min-w-[120px] flex-1 gap-2 rounded-lg border-outline-variant bg-surface-container-highest px-4 py-3.5 font-label-md text-label-md text-on-surface transition-all hover:bg-surface-variant active:scale-[0.98]"
          >
            <CalendarClock className="size-4 shrink-0 text-secondary" />
            <span>Later</span>
            <kbd className="ml-auto hidden md:block">L</kbd>
          </Button>

          <Button
            onClick={() => handleDecision("skip")}
            disabled={animatingDirection !== null}
            variant="outline"
            className="h-auto min-w-[120px] flex-1 gap-2 rounded-lg border-outline-variant bg-surface-container-highest px-4 py-3.5 font-label-md text-label-md text-on-surface transition-all hover:bg-surface-variant active:scale-[0.98]"
          >
            <ArrowRight className="size-4 shrink-0 text-muted-text" />
            <span>Skip</span>
            <kbd className="ml-auto hidden md:block">Space</kbd>
          </Button>

          <Button
            onClick={() => handleDecision("shortlist")}
            disabled={animatingDirection !== null}
            variant="outline"
            className="h-auto min-w-[120px] flex-1 gap-2 rounded-lg border-outline-variant bg-surface-container-highest px-4 py-3.5 font-label-md text-label-md text-on-surface transition-all hover:bg-surface-variant active:scale-[0.98]"
          >
            <Star className="size-4 shrink-0 fill-primary text-primary" />
            <span>Shortlist</span>
            <kbd className="ml-auto hidden md:block">S</kbd>
          </Button>
        </section>
      )}

      {/* Floating Undo Toast Notification */}
      {undoToast && (
        <div className="fixed bottom-14 left-1/2 z-50 flex max-w-[90%] -translate-x-1/2 animate-in items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-highest px-5 py-3 shadow-2xl duration-300 slide-in-from-bottom-5 fade-in sm:max-w-[450px]">
          <span className="flex-1 truncate text-label-md text-on-surface">
            {undoToast.message}
          </span>
          <Button
            onClick={handleUndo}
            variant="outline"
            size="xs"
            className="h-auto gap-1.5 border-primary/20 bg-primary/10 px-3 py-1.5 font-label-sm text-[12px] font-bold text-primary hover:bg-primary/20 hover:text-primary"
          >
            <RotateCcw className="size-3.5" />
            Undo
            <kbd className="ml-0.5 hidden border-primary/20 bg-primary/20 text-primary sm:inline">
              Z
            </kbd>
          </Button>
        </div>
      )}

      {/* Celebration Modal (Goal Reached) */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-4 backdrop-blur-sm duration-200 fade-in">
          <div className="relative w-full max-w-md animate-in rounded-xl border border-outline-variant bg-surface-container p-6 text-center shadow-2xl duration-200 zoom-in-95">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
              <CheckCircle2 className="size-8 text-primary" />
            </div>

            <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">
              Daily Target Met! 🎉
            </h2>
            <p className="mb-6 font-body-md text-body-md text-muted-text">
              Excellent focus! You have cleared or prioritized{" "}
              <strong>{sessionTarget}</strong> bookmarks. This represents active
              control over your reading list.
            </p>

            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className="w-full rounded-lg bg-primary py-3 text-center font-label-md text-label-md font-bold text-primary-foreground transition-colors hover:bg-primary/95"
              >
                Go to Inbox
              </Link>
              <Button
                onClick={() => {
                  setShowGoalModal(false)
                  setUserDismissedGoal(true)
                }}
                variant="outline"
                className="h-auto border-outline-variant bg-surface-container-highest py-3 font-label-md text-label-md text-on-surface hover:bg-surface-variant"
              >
                Keep Triaging
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
