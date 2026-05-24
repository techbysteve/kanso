import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { BookmarkedPost } from "@/lib/types"

interface KansoState {
  processedIds: string[]
  localShortlist: BookmarkedPost[]
  localLater: BookmarkedPost[]
  localRead: BookmarkedPost[]

  trackProcessedId: (id: string) => void
  untrackProcessedId: (id: string) => void
  addToLocalShortlist: (bookmark: BookmarkedPost) => void
  removeFromLocalShortlist: (id: string) => void
  addToLocalLater: (bookmark: BookmarkedPost) => void
  removeFromLocalLater: (id: string) => void
  addToLocalRead: (bookmark: BookmarkedPost) => void
  removeFromLocalRead: (id: string) => void
  clearAllLocalData: () => void
}

export const useKansoStore = create<KansoState>()(
  persist(
    (set) => ({
      processedIds: [],
      localShortlist: [],
      localLater: [],
      localRead: [],

      trackProcessedId: (id) =>
        set((state) => ({
          processedIds: state.processedIds.includes(id)
            ? state.processedIds
            : [...state.processedIds, id],
        })),

      untrackProcessedId: (id) =>
        set((state) => ({
          processedIds: state.processedIds.filter((item) => item !== id),
        })),

      addToLocalShortlist: (bookmark) =>
        set((state) => ({
          localShortlist: state.localShortlist.some((item) => item.id === bookmark.id)
            ? state.localShortlist
            : [...state.localShortlist, bookmark],
        })),

      removeFromLocalShortlist: (id) =>
        set((state) => ({
          localShortlist: state.localShortlist.filter((item) => item.id !== id),
        })),

      addToLocalLater: (bookmark) =>
        set((state) => ({
          localLater: state.localLater.some((item) => item.id === bookmark.id)
            ? state.localLater
            : [...state.localLater, bookmark],
        })),

      removeFromLocalLater: (id) =>
        set((state) => ({
          localLater: state.localLater.filter((item) => item.id !== id),
        })),

      addToLocalRead: (bookmark) =>
        set((state) => ({
          localRead: state.localRead.some((item) => item.id === bookmark.id)
            ? state.localRead
            : [...state.localRead, bookmark],
        })),

      removeFromLocalRead: (id) =>
        set((state) => ({
          localRead: state.localRead.filter((item) => item.id !== id),
        })),

      clearAllLocalData: () =>
        set({
          processedIds: [],
          localShortlist: [],
          localLater: [],
          localRead: [],
        }),
    }),
    {
      name: "kanso-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
