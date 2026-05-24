import { cookies } from "next/headers"
import { BookmarksResponse, Profile, BookmarkList } from "./types"

export const DAILY_DEV_API_KEY_MISSING_MESSAGE =
  "Daily.dev API key is not configured. Connect your account on the landing page to continue."

export function isDailyDevApiKeyMissingError(error: unknown) {
  return (
    error instanceof Error &&
    error.message === DAILY_DEV_API_KEY_MISSING_MESSAGE
  )
}

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

async function getApiKey(): Promise<string> {
  try {
    const cookieStore = await cookies()
    const userApiKey = cookieStore.get("daily_dev_api_key")?.value
    if (userApiKey) {
      return decodeCookieValue(userApiKey)
    }
  } catch {
    // Ignore when cookies() is unavailable outside a request context.
  }

  throw new Error(DAILY_DEV_API_KEY_MISSING_MESSAGE)
}

const BASE_URL = "https://api.daily.dev/public/v1"
export const DAILY_DEV_BOOKMARKS_TAG = "daily-dev-bookmarks"
export const DAILY_DEV_PROFILE_TAG = "daily-dev-profile"

export async function fetchBookmarks(
  options: {
    limit?: number
    cursor?: string | null
    unreadOnly?: boolean
    listId?: string | null
  } = {}
): Promise<BookmarksResponse> {
  const {
    limit = 20,
    cursor = null,
    unreadOnly = true,
    listId = null,
  } = options

  const apiKey = await getApiKey()

  const queryParams = new URLSearchParams()
  queryParams.set("limit", limit.toString())
  queryParams.set("unreadOnly", unreadOnly.toString())
  if (cursor) {
    queryParams.set("cursor", cursor)
  }
  if (listId) {
    queryParams.set("listId", listId)
  }

  const url = `${BASE_URL}/bookmarks/?${queryParams.toString()}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    let errorMessage = `Failed to fetch bookmarks: ${response.statusText} (${response.status})`
    try {
      const errorJson = await response.json()
      if (errorJson?.message) {
        errorMessage = errorJson.message
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage)
  }

  return response.json() as Promise<BookmarksResponse>
}

export async function fetchProfile(): Promise<Profile> {
  const apiKey = await getApiKey()

  const url = `${BASE_URL}/profile/`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    let errorMessage = `Failed to fetch profile: ${response.statusText} (${response.status})`
    try {
      const errorJson = await response.json()
      if (errorJson?.message) {
        errorMessage = errorJson.message
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage)
  }

  return response.json() as Promise<Profile>
}

export async function fetchBookmarkLists(): Promise<{ data: BookmarkList[] }> {
  const apiKey = await getApiKey()

  const url = `${BASE_URL}/bookmarks/lists`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    let errorMessage = `Failed to fetch bookmark lists: ${response.statusText} (${response.status})`
    try {
      const errorJson = await response.json()
      if (errorJson?.message) {
        errorMessage = errorJson.message
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage)
  }

  return response.json() as Promise<{ data: BookmarkList[] }>
}

export async function createBookmarkList(
  name: string,
  icon: string
): Promise<{ data: BookmarkList }> {
  const apiKey = await getApiKey()

  const url = `${BASE_URL}/bookmarks/lists`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, icon }),
  })

  if (!response.ok) {
    let errorMessage = `Failed to create bookmark list: ${response.statusText} (${response.status})`
    try {
      const errorJson = await response.json()
      if (errorJson?.message) {
        errorMessage = errorJson.message
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage)
  }

  return response.json() as Promise<{ data: BookmarkList }>
}

export async function moveBookmarkToList(
  id: string,
  listId: string | null
): Promise<void> {
  const apiKey = await getApiKey()

  const url = `${BASE_URL}/bookmarks/${id}`

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ listId }),
  })

  if (!response.ok) {
    let errorMessage = `Failed to move bookmark to list: ${response.statusText} (${response.status})`
    try {
      const errorJson = await response.json()
      if (errorJson?.message) {
        errorMessage = errorJson.message
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage)
  }
}

export async function deleteBookmark(id: string): Promise<void> {
  const apiKey = await getApiKey()

  const url = `${BASE_URL}/bookmarks/${id}`

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    let errorMessage = `Failed to delete bookmark: ${response.statusText} (${response.status})`
    try {
      const errorJson = await response.json()
      if (errorJson?.message) {
        errorMessage = errorJson.message
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage)
  }
}

export async function addBookmark(id: string): Promise<{
  data: { postId: string; createdAt: string; listId: string | null }[]
}> {
  const apiKey = await getApiKey()

  const url = `${BASE_URL}/bookmarks/`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ postIds: [id] }),
  })

  if (!response.ok) {
    let errorMessage = `Failed to add bookmark: ${response.statusText} (${response.status})`
    try {
      const errorJson = await response.json()
      if (errorJson?.message) {
        errorMessage = errorJson.message
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage)
  }

  return response.json() as Promise<{
    data: { postId: string; createdAt: string; listId: string | null }[]
  }>
}
