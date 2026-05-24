"use server"

import { revalidatePath, updateTag } from "next/cache"
import { cookies } from "next/headers"
import { ProjectIdea, ProjectIdeaArticle } from "./inspiration"
import {
  DAILY_DEV_BOOKMARKS_TAG,
  DAILY_DEV_PROFILE_TAG,
  fetchBookmarks,
  fetchProfile,
  moveBookmarkToList,
  deleteBookmark,
  addBookmark,
} from "./api-fetch"
import { ensureKansoBookmarkLists } from "./bookmark-lists"

const DAILY_DEV_PATHS = ["/", "/shortlist", "/triage", "/later"] as const

function revalidateDailyDevViews() {
  revalidatePath("/", "layout")
  DAILY_DEV_PATHS.forEach((path) => revalidatePath(path))
}

export async function syncDailyDevAction() {
  updateTag(DAILY_DEV_BOOKMARKS_TAG)
  updateTag(DAILY_DEV_PROFILE_TAG)

  await Promise.all([
    fetchProfile(),
    fetchBookmarks({
      limit: 1,
      unreadOnly: true,
    }),
  ])

  revalidateDailyDevViews()
}

// Server action to initialize the triage data
// This fetches profile, bookmarks, and lists, and sets up lists if Plus user
export async function getTriageDataAction() {
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

    // Try to retrieve or create the Lists (Plus users only)
    try {
      const listIds = await ensureKansoBookmarkLists()
      shortlistId = listIds.shortlistId
      laterId = listIds.laterId
      readId = listIds.readId
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.warn("Could not retrieve/create lists on Daily.dev:", errMsg)
      listError = errMsg
    }

    return {
      profile,
      bookmarks: bookmarksResponse.data,
      shortlistId,
      laterId,
      readId,
      isPlus: !!profile.isPlus,
      listError,
      error: null as string | null,
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return {
      profile: null,
      bookmarks: [],
      shortlistId: null,
      laterId: null,
      readId: null,
      isPlus: false,
      listError: null,
      error: errMsg,
    }
  }
}

// Server action to move bookmark to shortlist
export async function moveBookmarkToShortlistAction(
  id: string,
  shortlistId: string
) {
  await moveBookmarkToList(id, shortlistId)
  updateTag(DAILY_DEV_BOOKMARKS_TAG)
  revalidateDailyDevViews()
}

// Server action to move bookmark to later list
export async function moveBookmarkToLaterAction(id: string, laterId: string) {
  await moveBookmarkToList(id, laterId)
  updateTag(DAILY_DEV_BOOKMARKS_TAG)
  revalidateDailyDevViews()
}

// Server action to move bookmark to read list
export async function moveBookmarkToReadAction(id: string, readId: string) {
  await moveBookmarkToList(id, readId)
  updateTag(DAILY_DEV_BOOKMARKS_TAG)
  revalidateDailyDevViews()
}

// Server action to remove bookmark from any list (back to general unread)
export async function removeBookmarkFromListAction(id: string) {
  await moveBookmarkToList(id, null)
  updateTag(DAILY_DEV_BOOKMARKS_TAG)
  revalidateDailyDevViews()
}

// Server action to delete bookmark
export async function deleteBookmarkAction(id: string) {
  await deleteBookmark(id)
  updateTag(DAILY_DEV_BOOKMARKS_TAG)
  revalidateDailyDevViews()
}

// Server action to add bookmark (Undo delete)
export async function addBookmarkAction(id: string, listId?: string | null) {
  await addBookmark(id)
  if (listId) {
    // If it was in a list, move it back to the list
    await moveBookmarkToList(id, listId)
  }
  updateTag(DAILY_DEV_BOOKMARKS_TAG)
  revalidateDailyDevViews()
}

export async function generateProjectIdeaAction(
  articles: ProjectIdeaArticle[]
): Promise<ProjectIdea> {
  let apiKey = process.env.GROQ_API_KEY
  try {
    const cookieStore = await cookies()
    const userKey = cookieStore.get("groq_api_key")?.value
    if (userKey) {
      apiKey = userKey
    }
  } catch {
    // Ignore error when cookies() is called outside request context
  }

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured. Please configure it in settings.")
  }

  const articleContext = articles.slice(0, 8).map((article, index) => ({
    index: index + 1,
    title: article.title,
    summary: article.summary || "No summary available.",
    source: article.source,
    tags: article.tags.slice(0, 6),
    url: article.url,
  }))

  if (articleContext.length === 0) {
    throw new Error("Add articles to your shortlist before generating an idea.")
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You turn a developer's saved article list into one practical software project idea. Respond only with valid JSON.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Generate one project idea inspired by these articles.",
              requirements: [
                "Make it specific enough to build.",
                "Tie the idea directly to the supplied article themes.",
                "Keep every field concise.",
                "Return JSON with title, pitch, whyNow, mvp, stack, articleConnections.",
              ],
              articles: articleContext,
            }),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_completion_tokens: 700,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Groq request failed (${response.status}): ${errorText.slice(0, 240)}`
    )
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null
      }
    }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("Groq did not return an idea.")
  }

  try {
    return normalizeProjectIdea(JSON.parse(content))
  } catch {
    throw new Error("Groq returned an idea in an unexpected format.")
  }
}

function normalizeProjectIdea(value: unknown): ProjectIdea {
  const idea = value as Partial<ProjectIdea>

  return {
    title: requireText(idea.title, "Untitled project"),
    pitch: requireText(idea.pitch, "No pitch returned."),
    whyNow: requireText(idea.whyNow, "No timing rationale returned."),
    mvp: requireStringArray(idea.mvp).slice(0, 5),
    stack: requireStringArray(idea.stack).slice(0, 6),
    articleConnections: requireStringArray(idea.articleConnections).slice(0, 5),
  }
}

function requireText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function requireStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}
