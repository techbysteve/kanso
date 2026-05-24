export interface Source {
  id: string
  name: string
  handle: string
  image: string | null
}

export interface Author {
  name: string
  image: string | null
}

export interface BookmarkedPost {
  id: string
  title: string
  url: string
  image: string | null
  summary: string | null
  type: string
  publishedAt: string | null
  createdAt: string
  commentsPermalink: string
  source: Source
  tags: string[]
  readTime: number | null
  numUpvotes: number
  numComments: number
  author: Author | null
  bookmarkedAt: string
}

export interface Pagination {
  hasNextPage: boolean
  cursor: string | null
}

export interface BookmarksResponse {
  data: BookmarkedPost[]
  pagination: Pagination
}

export interface Profile {
  id: string
  name: string | null
  username: string | null
  bio: string | null
  image: string | null
  cover: string | null
  reputation: number
  permalink: string
  isPlus: boolean | null
}

export interface BookmarkList {
  id: string
  name: string
  icon: string | null
  createdAt: string
}
