import { ReadingList } from "@/components/reading-list"
import { ErrorState } from "@/components/error-state"
import { getReadingListData } from "@/lib/bookmark-lists"
import { calculatePriorityScores } from "@/lib/scoring"

import { cookies } from "next/headers"

export const revalidate = 60

type ReadingListSort = "score" | "oldest" | "shortest"

export default async function Page(props: {
  searchParams: Promise<{
    sort?: string
    page?: string
    tag?: string
    source?: string
    readTime?: string
    q?: string
  }>
}) {
  const searchParams = await props.searchParams
  const sort = normalizeSort(searchParams.sort)
  const pageParam = searchParams.page
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

  const cookieStore = await cookies()
  const settingsCookie = cookieStore.get("kanso_scoring_settings")?.value
  let scoringSettings = undefined
  if (settingsCookie) {
    try {
      scoringSettings = JSON.parse(settingsCookie)
    } catch {
      // ignore
    }
  }

  const data = await getReadingListData()

  if (data.error) {
    return <ErrorState error={data.error} />
  }

  const scoredBookmarks = calculatePriorityScores(
    data.bookmarks,
    scoringSettings
  )
  const bookmarkKey = getBookmarkKey(data.bookmarks)

  return (
    <main className="mx-auto mb-10 flex w-full max-w-none flex-1 flex-col px-margin-mobile py-6 md:mr-0 md:ml-64 md:w-[calc(100%-16rem)] md:px-margin-desktop">
      <ReadingList
        key={bookmarkKey}
        initialBookmarks={scoredBookmarks}
        isPlus={data.isPlus}
        readId={data.readId}
        listError={data.listError}
        sort={sort}
        currentPage={currentPage}
        tag={searchParams.tag || ""}
        source={searchParams.source || ""}
        readTime={searchParams.readTime || ""}
        query={searchParams.q || ""}
      />
    </main>
  )
}

function normalizeSort(sort?: string): ReadingListSort {
  if (sort === "oldest" || sort === "shortest") return sort
  return "score"
}

function getBookmarkKey(bookmarks: { id: string }[]) {
  return bookmarks.map((bookmark) => bookmark.id).join(":") || "empty"
}
