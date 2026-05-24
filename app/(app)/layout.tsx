import { Suspense } from "react"
import { Sidebar } from "@/components/sidebar"
import { fetchProfile, isDailyDevApiKeyMissingError } from "@/lib/api-fetch"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let profile = null
  try {
    profile = await fetchProfile()
  } catch (error) {
    if (!isDailyDevApiKeyMissingError(error)) {
      console.warn("Could not load user profile:", error)
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <Sidebar profile={profile} />
      </Suspense>
      {children}
      <Footer />
    </>
  )
}

function Footer() {
  return (
    <footer className="fixed right-0 bottom-0 left-0 z-40 flex h-10 items-center justify-center gap-gutter border-t border-outline-variant bg-surface-container-lowest px-margin-mobile md:left-64 md:px-margin-desktop">
      <div className="ml-auto font-label-sm text-label-sm text-muted-text">
        &copy; 2026 Kanso Engine for daily.dev
      </div>
    </footer>
  )
}
