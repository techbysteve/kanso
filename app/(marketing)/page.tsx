import { Bookmark, Layers, Sparkles, Star, Zap } from "lucide-react"

import { DailyDevConnectForm } from "@/components/daily-dev-connect-form"

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface selection:bg-primary/30">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute top-[-20%] left-[-10%] h-[60%] w-[60%] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute right-[-10%] bottom-[-20%] h-[50%] w-[50%] rounded-full bg-secondary/10 blur-[150px]" />
      </div>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-16 text-center lg:px-8">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-[0_0_20px_rgba(244,174,255,0.15)] ring-1 ring-primary/20 backdrop-blur ring-inset">
          <Sparkles className="size-4" />
          <span>The Anti-Library for Daily.dev</span>
        </div>

        <h1 className="mb-6 max-w-4xl font-headline-xl text-5xl leading-[1.1] font-extrabold tracking-tight text-on-surface drop-shadow-sm sm:text-6xl md:text-7xl">
          Decide what is{" "}
          <span className="bg-gradient-to-r from-primary via-primary-container to-secondary bg-clip-text text-transparent">
            worth reading.
          </span>
        </h1>

        <p className="mb-12 max-w-2xl text-lg leading-relaxed text-muted-text sm:text-xl">
          Transform your Daily.dev bookmark backlog into a lightweight,
          intelligent queue. Clear out the noise, prioritize the best, and read
          without guilt.
        </p>

        <DailyDevConnectForm />

        {/* Feature grid */}
        <div className="mx-auto mt-32 grid w-full max-w-5xl grid-cols-1 gap-6 text-left md:grid-cols-3">
          <div className="group rounded-3xl border border-outline-variant/50 bg-surface-container-low/30 p-8 backdrop-blur transition-all hover:border-primary/50 hover:bg-surface-container-low hover:shadow-[0_0_30px_rgba(244,174,255,0.1)]">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/20 text-primary transition-transform group-hover:scale-110 group-hover:bg-primary/30">
              <Zap className="size-7" />
            </div>
            <h3 className="mb-3 font-headline-md text-2xl font-bold text-on-surface">
              AI Prioritization
            </h3>
            <p className="text-[17px] leading-relaxed text-muted-text">
              Our scoring engine automatically weighs upvotes, read time, and
              your tag affinities to surface the highest-value content
              instantly.
            </p>
          </div>

          <div className="group rounded-3xl border border-outline-variant/50 bg-surface-container-low/30 p-8 backdrop-blur transition-all hover:border-secondary/50 hover:bg-surface-container-low hover:shadow-[0_0_30px_rgba(65,242,183,0.1)]">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-secondary/20 text-secondary transition-transform group-hover:scale-110 group-hover:bg-secondary/30">
              <Star className="size-7" />
            </div>
            <h3 className="mb-3 font-headline-md text-2xl font-bold text-on-surface">
              The Shortlist
            </h3>
            <p className="text-[17px] leading-relaxed text-muted-text">
              Keep a disciplined, capped queue of articles you actually intend
              to read. Say goodbye to endless, overwhelming backlogs forever.
            </p>
          </div>

          <div className="group rounded-3xl border border-outline-variant/50 bg-surface-container-low/30 p-8 backdrop-blur transition-all hover:border-tertiary/50 hover:bg-surface-container-low hover:shadow-[0_0_30px_rgba(255,181,156,0.1)]">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-tertiary/20 text-tertiary transition-transform group-hover:scale-110 group-hover:bg-tertiary/30">
              <Layers className="size-7" />
            </div>
            <h3 className="mb-3 font-headline-md text-2xl font-bold text-on-surface">
              Rapid Triage
            </h3>
            <p className="text-[17px] leading-relaxed text-muted-text">
              Process 20 bookmarks in just 5 minutes. Keyboard-first workflows
              make deciding what to read—or discard—entirely effortless.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-10 border-t border-outline-variant/30 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-2 text-muted-text">
            <Bookmark className="size-4" />
            <span className="text-sm font-semibold">Kanso</span>
          </div>
          <p className="text-sm text-muted-text">
            &copy; 2026 Kanso Engine for daily.dev.
          </p>
        </div>
      </footer>
    </div>
  )
}
