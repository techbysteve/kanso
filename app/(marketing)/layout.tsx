import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kanso - The Anti-Library for Daily.dev",
  description: "Clear or prioritize your Daily.dev bookmarks quickly and safely.",
}

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh flex-col bg-surface font-body-md text-body-md text-on-background">
      {children}
    </div>
  )
}
