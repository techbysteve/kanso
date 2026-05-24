import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface ScoringSettings {
  upvoteWeight: number
  recencyWeight: number
  readTimeWeight: number
  tagAffinityWeight: number
  hotThreshold: number
  readThreshold: number
  clearOutThreshold: number
  recencyDecayDays: number
  minIdealReadTime: number
  maxIdealReadTime: number
}

export const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  upvoteWeight: 40,
  recencyWeight: 25,
  readTimeWeight: 20,
  tagAffinityWeight: 15,
  hotThreshold: 80,
  readThreshold: 60,
  clearOutThreshold: 30,
  recencyDecayDays: 30,
  minIdealReadTime: 3,
  maxIdealReadTime: 8,
}

interface ScoringState {
  settings: ScoringSettings
  updateSettings: (settings: Partial<ScoringSettings>) => void
  resetSettings: () => void
}

const setCookie = (name: string, value: string) => {
  if (typeof document === "undefined") return
  if (value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
  } else {
    document.cookie = `${name}=; path=/; max-age=0`
  }
}

export const useScoringStore = create<ScoringState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SCORING_SETTINGS,

      updateSettings: (newSettings) =>
        set((state) => {
          const updated = { ...state.settings, ...newSettings }
          setCookie("kanso_scoring_settings", JSON.stringify(updated))
          return { settings: updated }
        }),

      resetSettings: () =>
        set(() => {
          setCookie("kanso_scoring_settings", "")
          return { settings: DEFAULT_SCORING_SETTINGS }
        }),
    }),
    {
      name: "kanso-scoring-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
