export interface UserStatistics {
  totalBeersRated: number
  countriesExplored: string[]
  beerTypeStats: { [key: string]: number }
  mostActiveDay: {
    date: string
    count: number
  }
  registrationDate: Date
  points: number
  rank: UserRank
  achievements: Achievement[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: Date
  category: "beginner" | "intermediate" | "advanced"
}

export interface UserRank {
  id: string
  name: string
  icon: string
  minPoints: number
  maxPoints: number
  level: number
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  photoURL?: string
  country: string
  points: number
  rank: UserRank
  totalBeersRated: number
}

