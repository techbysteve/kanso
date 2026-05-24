import { BookmarkedPost } from "./types"

export interface ScoringSettings {
  upvoteWeight: number
  recencyWeight: number
  readTimeWeight: number
  tagAffinityWeight: number
  hotThreshold: number
  readThreshold: number
  clearOutThreshold: number
  recencyDecayDays: number
  minIdealReadTime: number
  maxIdealReadTime: number
}

export const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  upvoteWeight: 40,
  recencyWeight: 25,
  readTimeWeight: 20,
  tagAffinityWeight: 15,
  hotThreshold: 80,
  readThreshold: 60,
  clearOutThreshold: 30,
  recencyDecayDays: 30,
  minIdealReadTime: 3,
  maxIdealReadTime: 8,
}

export interface ScoredBookmark extends BookmarkedPost {
  score: number
  scoreLabel: string
  scoreEmoji: string
  scoreColorClass: string
  scoreExplanation: string
}

export function calculatePriorityScores(
  bookmarks: BookmarkedPost[],
  settings?: ScoringSettings
): ScoredBookmark[] {
  const s = settings ? { ...DEFAULT_SCORING_SETTINGS, ...settings } : DEFAULT_SCORING_SETTINGS

  // 1. Calculate tag frequencies across all bookmarks for dynamic Tag Affinity
  const tagFreqs: Record<string, number> = {}
  bookmarks.forEach((b) => {
    const tags = Array.isArray(b.tags) ? b.tags : []
    tags.forEach((t) => {
      tagFreqs[t] = (tagFreqs[t] || 0) + 1
    })
  })

  // Helper to calculate raw tag score
  const getRawTagScore = (tags: string[]): number => {
    if (!tags || tags.length === 0) return 1
    const sum = tags.reduce((acc, t) => acc + (tagFreqs[t] || 0), 0)
    return sum / tags.length
  }

  // Find max raw tag score for normalization
  const rawTagScores = bookmarks.map((b) =>
    getRawTagScore(Array.isArray(b.tags) ? b.tags : [])
  )
  const maxRawTagScore = Math.max(...rawTagScores, 1)

  // Normalize weights to sum to 1.0 (to handle user adjustments that don't total 100%)
  const weightSum =
    (s.upvoteWeight || 0) +
    (s.recencyWeight || 0) +
    (s.readTimeWeight || 0) +
    (s.tagAffinityWeight || 0)
  const weightScale = weightSum > 0 ? 1 / weightSum : 0
  
  const wUpvote = (s.upvoteWeight || 0) * weightScale
  const wRecency = (s.recencyWeight || 0) * weightScale
  const wReadTime = (s.readTimeWeight || 0) * weightScale
  const wTagAffinity = (s.tagAffinityWeight || 0) * weightScale

  return bookmarks.map((b) => {
    // A. Upvote Score - Log-normalized up to 50 upvotes
    const upvotes =
      typeof b.numUpvotes === "number" && !isNaN(b.numUpvotes)
        ? b.numUpvotes
        : 0
    const upvoteScore = Math.min(Math.log1p(upvotes) / Math.log1p(50), 1) * 100

    // B. Recency Score - Decay over configured decay days
    const dateString =
      b.bookmarkedAt || b.createdAt || b.publishedAt || new Date().toISOString()
    const dateMs = new Date(dateString).getTime()
    const ageInMs = isNaN(dateMs) ? 0 : Date.now() - dateMs
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
    const decayDays = s.recencyDecayDays || 30
    const recencyScore = Math.max(0, 100 - (ageInDays / decayDays) * 100)

    // C. Read Time Fit Score - Peak at configured ideal read time range
    const readTime =
      typeof b.readTime === "number" && !isNaN(b.readTime) ? b.readTime : null
    let readTimeScore = 50 // default fallback if null
    if (readTime !== null) {
      const minIdeal = s.minIdealReadTime ?? 3
      const maxIdeal = s.maxIdealReadTime ?? 8
      if (readTime >= minIdeal && readTime <= maxIdeal) {
        readTimeScore = 100
      } else if (readTime === minIdeal - 1 || (readTime >= maxIdeal + 1 && readTime <= maxIdeal + 6)) {
        readTimeScore = 70
      } else {
        readTimeScore = 30
      }
    }

    // D. Tag Affinity Score - Dynamic normalization
    const tags = Array.isArray(b.tags) ? b.tags : []
    const rawTagScore = getRawTagScore(tags)
    const tagAffinityScore = (rawTagScore / maxRawTagScore) * 100

    // E. Total Weighted Score
    const totalScore = Math.round(
      (isNaN(upvoteScore) ? 0 : upvoteScore) * wUpvote +
        (isNaN(recencyScore) ? 0 : recencyScore) * wRecency +
        (isNaN(readTimeScore) ? 0 : readTimeScore) * wReadTime +
        (isNaN(tagAffinityScore) ? 0 : tagAffinityScore) * wTagAffinity
    )

    // F. Score Labels & Colors
    let scoreLabel = "🗃️ Maybe"
    let scoreEmoji = "🗃️"
    let scoreColorClass =
      "bg-surface-container-high text-muted-text border-outline-variant"
    if (totalScore >= s.hotThreshold) {
      scoreLabel = "🔥 Hot"
      scoreEmoji = "🔥"
      scoreColorClass = "bg-primary/20 text-primary border-primary/30"
    } else if (totalScore >= s.readThreshold) {
      scoreLabel = "📖 Read"
      scoreEmoji = "📖"
      scoreColorClass = "bg-secondary/20 text-secondary border-secondary/30"
    } else if (totalScore < s.clearOutThreshold) {
      scoreLabel = "🧹 Clear Out"
      scoreEmoji = "🧹"
      scoreColorClass = "bg-error/20 text-error border-error/30"
    }

    // G. Generate Explanation String
    const explanationParts: string[] = []

    // Upvotes part
    if (upvotes >= 20) {
      explanationParts.push("Highly upvoted")
    } else if (upvotes >= 5) {
      explanationParts.push("Popular")
    } else {
      explanationParts.push("Low engagement")
    }

    // Read time part
    if (readTime !== null) {
      explanationParts.push(`${readTime} min read`)
    } else {
      explanationParts.push("Short read")
    }

    // Recency part
    if (ageInDays <= 2) {
      explanationParts.push("Freshly saved")
    } else if (ageInDays >= (s.recencyDecayDays || 30)) {
      explanationParts.push("Stale save")
    }

    // Tag match part
    if (tagAffinityScore >= 75 && b.tags.length > 0) {
      explanationParts.push("matches your top tags")
    }

    const scoreExplanation = explanationParts.join(" · ")

    return {
      ...b,
      score: totalScore,
      scoreLabel,
      scoreEmoji,
      scoreColorClass,
      scoreExplanation,
    }
  })
}

