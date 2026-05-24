"use client"

import Link from "next/link"
import { AlertTriangle, ArrowLeft, ExternalLink } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ErrorState({ error }: { error: string }) {
  return (
    <main className="flex w-full flex-1 items-center justify-center px-6 py-20 md:ml-64 md:w-[calc(100%-16rem)]">
      <div className="flex w-full max-w-[800px] flex-col items-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-error/20 bg-error/10">
          <AlertTriangle aria-hidden="true" className="size-8 text-error" />
        </div>
        <h1 className="mb-3 text-center font-headline-lg text-headline-lg text-on-surface">
          Failed to Connect to Daily.dev
        </h1>

        <div className="mb-8 flex flex-col items-center gap-4">
          <p className="max-w-[500px] text-center font-body-lg text-body-lg text-muted-text">
            {error}
          </p>
        </div>

        <div className="w-full rounded-lg border border-outline-variant bg-surface-container p-5">
          <h2 className="mb-2 font-headline-md text-headline-md text-on-surface">
            Connect Your Account
          </h2>
          <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
            Daily.dev credentials are entered from the landing page and saved in
            your browser for this app.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
            href="/"
            className={cn(
              buttonVariants(),
              "min-h-11 w-full gap-2 rounded-lg bg-primary-fixed px-5 py-2.5 text-on-primary-fixed hover:bg-primary-fixed-dim sm:w-auto"
            )}
          >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Set Key on Landing Page
            </Link>
            <a
            href="https://app.daily.dev/settings/api"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-5 py-2.5 font-label-md text-label-md text-on-surface hover:bg-surface-container-high sm:w-auto"
          >
              Get Daily.dev Key
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
