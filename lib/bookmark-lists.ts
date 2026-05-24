import {
  createBookmarkList,
  fetchBookmarkLists,
  fetchBookmarks,
  fetchProfile,
} from "@/lib/api-fetch"
import { BookmarkedPost, Profile } from "@/lib/types"

const SHORTLIST_NAMES = ["⭐ Shortlist", "Shortlist"]
const LATER_NAMES = ["📚 Later", "Later"]
const READ_NAMES = ["✅ Read", "Read"]

export interface KansoListIds {
  shortlistId: string | null
  laterId: string | null
  readId: string | null
}

export async function ensureKansoBookmarkLists(): Promise<KansoListIds> {
  const listsResponse = await fetchBookmarkLists()
  const lists = listsResponse.data

  let shortlistList = lists.find((list) => SHORTLIST_NAMES.includes(list.name))
  let laterList = lists.find((list) => LATER_NAMES.includes(list.name))
  let readList = lists.find((list) => READ_NAMES.includes(list.name))

  if (!shortlistList) {
    const createRes = await createBookmarkList("⭐ Shortlist", "⭐")
    shortlistList = createRes.data
  }

  if (!laterList) {
    const createRes = await createBookmarkList("📚 Later", "📚")
    laterList = createRes.data
  }

  if (!readList) {
    const createRes = await createBookmarkList("✅ Read", "✅")
    readList = createRes.data
  }

  return {
    shortlistId: shortlistList.id,
    laterId: laterList.id,
    readId: readList.id,
  }
}

export async function getLaterListData(): Promise<{
  profile: Profile | null
  bookmarks: BookmarkedPost[]
  shortlistId: string | null
  laterId: string | null
  readId: string | null
  isPlus: boolean
  listError: string | null
  error: string | null
}> {
  return getKansoListData("later")
}

export async function getShortlistData(): Promise<{
  profile: Profile | null
  bookmarks: BookmarkedPost[]
  shortlistId: string | null
  laterId: string | null
  readId: string | null
  isPlus: boolean
  listError: string | null
  error: string | null
}> {
  return getKansoListData("shortlist")
}

export async function getReadingListData(): Promise<{
  profile: Profile | null
  bookmarks: BookmarkedPost[]
  shortlistId: string | null
  laterId: string | null
  readId: string | null
  isPlus: boolean
  listError: string | null
  error: string | null
}> {
  try {
    const profile = await fetchProfile()
    const bookmarksResponse = await fetchBookmarks({
      limit: 50,
      unreadOnly: true,
    })
    let shortlistId: string | null = null
    let laterId: string | null = null
    let readId: string | null = null
    let listError: string | null = null

    try {
      const listIds = await ensureKansoBookmarkLists()
      shortlistId = listIds.shortlistId
      laterId = listIds.laterId
      readId = listIds.readId
    } catch (err: unknown) {
      listError = err instanceof Error ? err.message : String(err)
    }

    return {
      profile,
      bookmarks: bookmarksResponse.data,
      shortlistId,
      laterId,
      readId,
      isPlus: !!profile.isPlus && !!readId,
      listError,
      error: null,
    }
  } catch (err: unknown) {
    return {
      profile: null,
      bookmarks: [],
      shortlistId: null,
      laterId: null,
      readId: null,
      isPlus: false,
      listError: null,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function getKansoListData(target: "shortlist" | "later"): Promise<{
  profile: Profile | null
  bookmarks: BookmarkedPost[]
  shortlistId: string | null
  laterId: string | null
  readId: string | null
  isPlus: boolean
  listError: string | null
  error: string | null
}> {
  try {
    const profile = await fetchProfile()
    let shortlistId: string | null = null
    let laterId: string | null = null
    let readId: string | null = null
    let bookmarks: BookmarkedPost[] = []
    let listError: string | null = null

    try {
      const listIds = await ensureKansoBookmarkLists()
      shortlistId = listIds.shortlistId
      laterId = listIds.laterId
      readId = listIds.readId

      const targetListId = target === "shortlist" ? shortlistId : laterId

      if (targetListId) {
        const bookmarksResponse = await fetchBookmarks({
          limit: 50,
          listId: targetListId,
          unreadOnly: true,
        })
        bookmarks = bookmarksResponse.data
      }
    } catch (err: unknown) {
      listError = err instanceof Error ? err.message : String(err)
    }

    return {
      profile,
      bookmarks,
      shortlistId,
      laterId,
      readId,
      isPlus: !!profile.isPlus && !!shortlistId && !!laterId && !!readId,
      listError,
      error: null,
    }
  } catch (err: unknown) {
    return {
      profile: null,
      bookmarks: [],
      shortlistId: null,
      laterId: null,
      readId: null,
      isPlus: false,
      listError: null,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
