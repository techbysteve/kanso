export interface ProjectIdeaArticle {
  title: string
  summary: string | null
  source: string
  tags: string[]
  url: string
}

export interface ProjectIdea {
  title: string
  pitch: string
  whyNow: string
  mvp: string[]
  stack: string[]
  articleConnections: string[]
}
