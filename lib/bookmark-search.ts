import type { BookmarkedPost } from "@/lib/types"

export function matchesBookmarkSearch(bookmark: BookmarkedPost, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const searchableText = [
    bookmark.title,
    bookmark.summary,
    bookmark.url,
    bookmark.commentsPermalink,
    bookmark.source?.name,
    bookmark.source?.handle,
    bookmark.author?.name,
    ...bookmark.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return searchableText.includes(normalizedQuery)
}
