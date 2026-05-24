import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface SettingsState {
  dailyDevApiKey: string
  groqApiKey: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  setDailyDevApiKey: (key: string) => void
  setGroqApiKey: (key: string) => void
  clearSettings: () => void
}

const setCookie = (name: string, value: string) => {
  if (typeof document === "undefined") return
  if (value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
  } else {
    document.cookie = `${name}=; path=/; max-age=0`
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dailyDevApiKey: "",
      groqApiKey: "",
      isOpen: false,

      setIsOpen: (isOpen) => set({ isOpen }),

      setDailyDevApiKey: (key) =>
        set(() => {
          setCookie("daily_dev_api_key", key)
          return { dailyDevApiKey: key }
        }),

      setGroqApiKey: (key) =>
        set(() => {
          setCookie("groq_api_key", key)
          return { groqApiKey: key }
        }),

      clearSettings: () =>
        set(() => {
          setCookie("daily_dev_api_key", "")
          setCookie("groq_api_key", "")
          return {
            dailyDevApiKey: "",
            groqApiKey: "",
          }
        }),
    }),
    {
      name: "kanso-settings-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
