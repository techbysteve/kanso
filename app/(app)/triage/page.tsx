import { Layers3 } from "lucide-react"

import { TriageDeck } from "@/components/triage-deck"
import { ErrorState } from "@/components/error-state"
import { getTriageDataAction } from "@/lib/actions"

export const revalidate = 0 // always fetch fresh bookmarks for triage session

export default async function TriagePage() {
  const data = await getTriageDataAction()

  if (data.error) {
    return <ErrorState error={data.error} />
  }

  const bookmarkKey = getBookmarkKey(data.bookmarks)

  return (
    <main className="mx-auto mb-10 flex w-full max-w-none flex-1 flex-col px-margin-mobile py-6 md:mr-0 md:ml-64 md:w-[calc(100%-16rem)] md:px-margin-desktop">
      <header className="mb-8">
        <h1 className="mb-2 flex items-center gap-3 font-headline-xl text-headline-lg-mobile text-on-surface md:text-headline-xl">
          <Layers3
            aria-hidden="true"
            className="size-8 text-primary md:size-10"
          />
          Triage Loop
        </h1>
        <p className="font-body-lg text-body-lg text-muted-text">
          Focus on one bookmark at a time, make decisions fast, and conquer
          inbox clutter.
        </p>
      </header>

      <TriageDeck
        key={bookmarkKey}
        initialBookmarks={data.bookmarks}
        profile={data.profile}
        initialShortlistId={data.shortlistId}
        initialLaterId={data.laterId}
        isPlus={data.isPlus}
        listError={data.listError}
      />
    </main>
  )
}

function getBookmarkKey(bookmarks: { id: string }[]) {
  return bookmarks.map((bookmark) => bookmark.id).join(":") || "empty"
}
