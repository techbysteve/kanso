import { redirect } from "next/navigation"

export default async function ReadingListPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const searchParams = await props.searchParams
  const params = new URLSearchParams()

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
      return
    }

    if (value) params.set(key, value)
  })

  const queryString = params.toString()
  redirect(queryString ? `/?${queryString}` : "/")
}
