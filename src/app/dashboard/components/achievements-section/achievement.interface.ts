export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  // NEW: tells the service WHAT to measure on UserStatistics, generically,
  // instead of having a hardcoded switch-statement per achievement ID.
  // Supported forms:
  //   "totalBeersRated"          -> stats.totalBeersRated directly
  //   "countriesExplored.length" -> stats.countriesExplored.length (array fields)
  //   "beerType:IPA"             -> sum of beerTypeStats matching the IPA category
  //   "beerType:NEIPA,DOUBLE INDIA PALE ALE" -> sum across multiple categories
  metric: string
  levels: {
    level: number
    icon: string
    description: string
    requirement: number
  }[]
}

export interface UserAchievement extends Achievement {
  currentLevel: number
  progress: number
  completed: boolean
  currentLevelDetails?: {
    level: number
    icon: string
    description: string
  }
}

export interface CombinedAchievement extends Achievement, UserAchievement {
  category: string
  currentLevelDetails?: Achievement["levels"][number] & { requirement: number }
}