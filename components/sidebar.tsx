"use client"

import type { FormEvent } from "react"
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Profile } from "@/lib/types"
import {
  Bookmark,
  CalendarClock,
  Layers3,
  RefreshCw,
  Search,
  Settings,
  Star,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { syncDailyDevAction } from "@/lib/actions"
import { useSettingsStore } from "@/hooks/use-settings-store"

type SyncState = "idle" | "syncing" | "success" | "error"

const navItems = [
  { label: "Inbox", icon: Bookmark, path: "/inbox" },
  { label: "Shortlist", icon: Star, path: "/shortlist" },
  { label: "Later", icon: CalendarClock, path: "/later" },
  { label: "Triage", icon: Layers3, path: "/triage" },
]

// No supportItems needed since we use a button for settings

interface SidebarProps {
  profile?: Profile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearchQuery = searchParams.get("q") || ""
  const [syncState, setSyncState] = useState<SyncState>("idle")
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSyncPending, startSyncTransition] = useTransition()
  const setIsSettingsOpen = useSettingsStore((state) => state.setIsOpen)

  useEffect(() => {
    if (syncState !== "success") return

    const timeoutId = window.setTimeout(() => {
      setSyncState("idle")
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [syncState])

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : profile?.username?.slice(0, 2).toUpperCase() || "GD"

  const displayName = profile?.name || profile?.username || "Guest Developer"
  const reputationText =
    profile?.reputation !== undefined ? ` • ${profile.reputation} rep` : ""
  const displaySub = profile?.username
    ? `@${profile.username}${reputationText}`
    : "API key not configured"
  const isSyncing = syncState === "syncing" || isSyncPending
  const syncButtonLabel = isSyncing
    ? "Syncing..."
    : syncState === "success"
      ? "Synced"
      : syncState === "error"
        ? "Retry Sync"
        : "Sync Daily.dev"

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const params = new URLSearchParams(searchParams.toString())
    const normalizedQuery = String(formData.get("q") || "").trim()
    const searchPath =
      pathname === "/inbox" ||
      pathname.startsWith("/shortlist") ||
      pathname.startsWith("/later")
        ? pathname
        : "/inbox"

    if (normalizedQuery) params.set("q", normalizedQuery)
    else params.delete("q")

    params.delete("page")
    const queryString = params.toString()
    router.push(queryString ? `${searchPath}?${queryString}` : searchPath)
  }

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    const searchPath =
      pathname === "/inbox" ||
      pathname.startsWith("/shortlist") ||
      pathname.startsWith("/later")
        ? pathname
        : "/inbox"

    params.delete("q")
    params.delete("page")
    const queryString = params.toString()
    router.push(queryString ? `${searchPath}?${queryString}` : searchPath)
  }

  const handleSyncDailyDev = () => {
    setSyncState("syncing")
    setSyncError(null)

    startSyncTransition(async () => {
      try {
        await syncDailyDevAction()
        router.refresh()
        setSyncState("success")
      } catch (error: unknown) {
        setSyncError(error instanceof Error ? error.message : String(error))
        setSyncState("error")
      }
    })
  }

  return (
    <nav className="fixed top-0 left-0 z-50 hidden h-screen w-64 flex-col border-r border-outline-variant bg-surface-container px-4 py-6 md:flex">
      <div className="mb-5 flex h-10 items-center px-2">
        <Link
          href="/inbox"
          className="font-headline-md text-headline-md font-bold text-primary"
        >
          Kanso
        </Link>
      </div>

      <form
        className="group relative mb-6 block"
        onSubmit={handleSearchSubmit}
        role="search"
      >
        <label htmlFor="sidebar-search" className="sr-only">
          Search articles
        </label>
        <Search
          aria-hidden="true"
          className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary"
        />
        <Input
          key={`${pathname}:${currentSearchQuery}`}
          id="sidebar-search"
          className="w-full rounded-lg border border-outline-variant bg-surface-container-highest py-2.5 pr-10 pl-10 font-body-md text-body-md text-on-surface placeholder:text-muted-text focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          defaultValue={currentSearchQuery}
          name="q"
          placeholder="Search articles..."
          type="search"
        />
        {currentSearchQuery && (
          <button
            aria-label="Clear search"
            className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
            onClick={clearSearch}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </form>

      <div className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.path === "/inbox"
              ? pathname === "/inbox"
              : pathname.startsWith(item.path)

          return (
            <Link
              className={
                isActive
                  ? "flex scale-[0.98] items-center gap-3 rounded-r-lg border-l-4 border-primary bg-primary/10 px-4 py-3 font-bold text-primary transition-all"
                  : "flex items-center gap-3 rounded-lg px-4 py-3 font-medium text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-highest hover:text-on-surface"
              }
              href={item.path}
              key={item.label}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="mt-auto space-y-4">
        <div>
          <Button
            aria-busy={isSyncing}
            aria-describedby={
              syncState === "success" || syncError
                ? "daily-dev-sync-status"
                : undefined
            }
            className="h-auto w-full gap-2 border-outline-variant bg-surface-container-highest py-2.5 font-label-md [font-size:14px] [line-height:20px] text-on-surface hover:bg-surface-variant"
            disabled={isSyncing}
            onClick={handleSyncDailyDev}
            variant="outline"
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            {syncButtonLabel}
          </Button>
          {(syncState === "success" || syncError) && (
            <p
              aria-live="polite"
              className={`mt-2 px-1 font-label-sm text-[11px] leading-4 break-words ${
                syncError ? "text-error" : "text-muted-text"
              }`}
              id="daily-dev-sync-status"
            >
              {syncError || "Daily.dev is up to date."}
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-outline-variant pt-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 font-medium text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-highest hover:text-on-surface"
          >
            <Settings aria-hidden="true" className="size-5" />
            <span className="font-label-md text-label-md">Settings</span>
          </button>
        </div>

        <div className="flex items-center gap-3 px-2 pt-2">
          {profile?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="size-8 shrink-0 rounded-full border border-outline-variant object-cover"
            />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div
              className="truncate font-label-sm text-label-sm text-on-surface"
              title={displayName}
            >
              {displayName}
            </div>
            <div
              className="truncate font-label-sm text-[10px] leading-4 text-muted-text"
              title={displaySub}
            >
              {displaySub}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
