"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, KeyRound, PlugZap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSettingsStore } from "@/hooks/use-settings-store"

export function DailyDevConnectForm() {
  const router = useRouter()
  const dailyDevApiKey = useSettingsStore((state) => state.dailyDevApiKey)
  const setDailyDevApiKey = useSettingsStore((state) => state.setDailyDevApiKey)
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const normalizedApiKey = String(formData.get("dailyDevApiKey") || "").trim()

    if (!normalizedApiKey) {
      setStatus("error")
      return
    }

    setDailyDevApiKey(normalizedApiKey)
    setStatus("saved")
    router.refresh()
    router.push("/inbox")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-low/70 p-4 text-left shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
            <PlugZap aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="font-headline-md text-lg font-semibold text-on-surface">
              Connect daily.dev
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-text">
              Paste your personal API key to sync bookmarks from your account.
            </p>
          </div>
        </div>
        <a
          href="https://app.daily.dev/settings/api"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 self-start font-label-sm text-xs text-secondary hover:underline"
        >
          Get key <ExternalLink aria-hidden="true" className="size-3" />
        </a>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="daily-dev-key" className="sr-only">
          daily.dev API key
        </label>
        <div className="relative min-w-0 flex-1">
          <KeyRound
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            key={dailyDevApiKey}
            id="daily-dev-key"
            name="dailyDevApiKey"
            type="password"
            onInput={() => {
              setStatus("idle")
            }}
            defaultValue={dailyDevApiKey}
            placeholder="Paste daily.dev API key"
            className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-highest py-3 pr-3 pl-10 text-sm text-on-surface placeholder:text-muted-text focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
        <Button
          type="submit"
          className="h-12 shrink-0 rounded-lg bg-primary-fixed px-5 font-semibold text-on-primary-fixed hover:bg-primary-fixed-dim"
        >
          Connect Account
        </Button>
      </div>

      {status !== "idle" && (
        <p
          aria-live="polite"
          className={
            status === "saved"
              ? "font-label-sm text-xs text-secondary"
              : "font-label-sm text-xs text-error"
          }
        >
          {status === "saved"
            ? "Connected. Loading your inbox..."
            : "Enter a daily.dev API key before connecting."}
        </p>
      )}
    </form>
  )
}
