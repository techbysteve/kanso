"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSettingsStore } from "@/hooks/use-settings-store"
import { useScoringStore } from "@/hooks/use-scoring-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Key,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Sliders,
} from "lucide-react"

export function SettingsDialog() {
  const { isOpen, setIsOpen, dailyDevApiKey, groqApiKey } = useSettingsStore()

  // Sync cookies on initial load in client side just in case
  useEffect(() => {
    if (dailyDevApiKey) {
      document.cookie = `daily_dev_api_key=${encodeURIComponent(dailyDevApiKey)}; path=/; max-age=31536000; SameSite=Lax`
    }
    if (groqApiKey) {
      document.cookie = `groq_api_key=${encodeURIComponent(groqApiKey)}; path=/; max-age=31536000; SameSite=Lax`
    }
  }, [dailyDevApiKey, groqApiKey])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="h-[min(520px,calc(100dvh-2rem))] max-w-lg grid-rows-[auto_minmax(0,1fr)] border border-outline-variant bg-surface-container text-on-surface">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline-md text-headline-md text-primary">
            <Key className="size-5" />
            AI & Scoring Settings
          </DialogTitle>
          <DialogDescription className="mt-1 font-body-md text-muted-text">
            Configure Groq and fine-tune {"Kanso's"} bookmark prioritization
            engine.
          </DialogDescription>
        </DialogHeader>

        {isOpen && <SettingsForm onClose={() => setIsOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function SettingsForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"api" | "scoring">("api")

  // API keys store
  const { groqApiKey, setGroqApiKey, clearSettings } = useSettingsStore()

  // Scoring store
  const {
    settings: scoringSettings,
    updateSettings: updateScoringSettings,
    resetSettings: resetScoringSettings,
  } = useScoringStore()

  // Local state for API keys
  const [localGroqKey, setLocalGroqKey] = useState(groqApiKey || "")

  // Local state for Scoring Settings (weights only)
  const [upvoteWeight, setUpvoteWeight] = useState(scoringSettings.upvoteWeight)
  const [recencyWeight, setRecencyWeight] = useState(
    scoringSettings.recencyWeight
  )
  const [readTimeWeight, setReadTimeWeight] = useState(
    scoringSettings.readTimeWeight
  )
  const [tagAffinityWeight, setTagAffinityWeight] = useState(
    scoringSettings.tagAffinityWeight
  )

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const totalWeight =
    upvoteWeight + recencyWeight + readTimeWeight + tagAffinityWeight
  const isWeightBalanced = totalWeight === 100

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Save API keys
    setGroqApiKey(localGroqKey.trim())

    // Save scoring weights (thresholds and params default values are retained)
    updateScoringSettings({
      upvoteWeight,
      recencyWeight,
      readTimeWeight,
      tagAffinityWeight,
    })

    setSaveSuccess(true)
    setIsSaving(false)

    // Refresh the router to update server-side fetched data
    router.refresh()

    setTimeout(() => {
      onClose()
    }, 1000)
  }

  const handleReset = () => {
    clearSettings()
    resetScoringSettings()

    setLocalGroqKey("")

    setUpvoteWeight(40)
    setRecencyWeight(25)
    setReadTimeWeight(20)
    setTagAffinityWeight(15)

    router.refresh()
    onClose()
  }

  return (
    <form onSubmit={handleSave} className="flex min-h-0 flex-col gap-4">
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "api" | "scoring")}
        className="min-h-0 flex-1 gap-5"
      >
        <TabsList className="grid !h-auto min-h-11 w-full grid-cols-2 gap-1 rounded-lg border border-outline-variant bg-surface-container-high p-1">
          <TabsTrigger
            value="api"
            className="h-9 min-w-0 gap-2 rounded-md px-3 py-2 font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface data-[active]:bg-surface-container-low data-[active]:text-primary"
          >
            <Key className="size-4" />
            AI Credentials
          </TabsTrigger>
          <TabsTrigger
            value="scoring"
            className="h-9 min-w-0 gap-2 rounded-md px-3 py-2 font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface data-[active]:bg-surface-container-low data-[active]:text-primary"
          >
            <Sliders className="size-4" />
            Scoring Engine
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents: API Key */}
        <TabsContent
          value="api"
          className="animate-fade-in min-h-0 space-y-4 overflow-y-auto pr-1 duration-200 outline-none"
        >
          {/* Groq API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="groq-key"
                className="text-sm font-semibold text-on-surface"
              >
                Groq API Key (Optional)
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-label-sm text-[11px] text-secondary hover:underline"
              >
                Get Key <ExternalLink className="size-3" />
              </a>
            </div>
            <input
              id="groq-key"
              type="password"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-muted-text focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              placeholder="Paste your Groq gsk_... key"
              value={localGroqKey}
              onChange={(e) => setLocalGroqKey(e.target.value)}
            />
            <p className="font-label-sm text-[11px] leading-relaxed text-muted-text">
              Used to generate tailored software project ideas from your
              bookmarked articles.
            </p>
          </div>
        </TabsContent>

        {/* Tab Contents: Scoring Settings */}
        <TabsContent
          value="scoring"
          className="animate-fade-in min-h-0 space-y-5 overflow-y-auto pr-1 duration-200 outline-none"
        >
          {/* Priority Weights Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-on-surface">
                Component Weights (%)
              </h4>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 font-label-sm text-[10px] font-bold",
                  isWeightBalanced
                    ? "border-secondary/20 bg-secondary/10 text-secondary"
                    : "border-tertiary/20 bg-tertiary/10 text-tertiary"
                )}
              >
                {isWeightBalanced
                  ? "Sum: 100% (Balanced)"
                  : `Sum: ${totalWeight}% (Will auto-normalize)`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Upvote Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-text">
                  <label htmlFor="upvote-weight">Upvotes weight</label>
                  <span>{upvoteWeight}%</span>
                </div>
                <input
                  id="upvote-weight"
                  type="range"
                  min="0"
                  max="100"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
                  value={upvoteWeight}
                  onChange={(e) => setUpvoteWeight(Number(e.target.value))}
                />
              </div>

              {/* Recency Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-text">
                  <label htmlFor="recency-weight">Recency weight</label>
                  <span>{recencyWeight}%</span>
                </div>
                <input
                  id="recency-weight"
                  type="range"
                  min="0"
                  max="100"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
                  value={recencyWeight}
                  onChange={(e) => setRecencyWeight(Number(e.target.value))}
                />
              </div>

              {/* Read Time Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-text">
                  <label htmlFor="readtime-weight">Read Time weight</label>
                  <span>{readTimeWeight}%</span>
                </div>
                <input
                  id="readtime-weight"
                  type="range"
                  min="0"
                  max="100"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
                  value={readTimeWeight}
                  onChange={(e) => setReadTimeWeight(Number(e.target.value))}
                />
              </div>

              {/* Tag Affinity Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-text">
                  <label htmlFor="tag-weight">Tag Affinity weight</label>
                  <span>{tagAffinityWeight}%</span>
                </div>
                <input
                  id="tag-weight"
                  type="range"
                  min="0"
                  max="100"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
                  value={tagAffinityWeight}
                  onChange={(e) => setTagAffinityWeight(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-secondary/20 bg-secondary/15 px-3 py-2 text-sm text-secondary">
          <ShieldCheck className="size-4 shrink-0" />
          <span>All settings saved! Refreshing engine...</span>
        </div>
      )}

      <DialogFooter className="mt-2 flex flex-col gap-2 border-t border-outline-variant pt-4 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="destructive"
          size="default"
          onClick={handleReset}
          className="h-8 self-start px-3 sm:self-auto"
        >
          Reset All
        </Button>
        <div className="flex justify-end gap-2 sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onClose}
            className="h-8 border-outline-variant text-on-surface hover:bg-surface-variant"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="default"
            className="h-8 gap-1.5 bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/95"
            disabled={isSaving || saveSuccess}
          >
            {isSaving ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Save Changes
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}
