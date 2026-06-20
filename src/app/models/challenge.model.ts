import type { Timestamp } from "@angular/fire/firestore"
export type ChallengeType = "rate_count" | "rate_beer_type" | "rate_country" | "rate_distinct_countries"

export interface Challenge {
  id: string
  name: string
  description: string
  type: ChallengeType
  criteria?: string // e.g. "IPA" for rate_beer_type, a countryId for rate_country
  threshold: number
  progress: number
  startDate: Timestamp
  endDate: Timestamp
  completed: boolean
  rewardXP: number
  // Only used by "rate_distinct_countries" — see the matching comment in
  // functions/src/index.ts for why this exists.
  countedCountryIds?: string[]
}
