import { Timestamp } from "@angular/fire/firestore"

export interface UserProfile {
  uid: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
  username: string | null
  firstName?: string
  lastName?: string
  photoURL: string | null
  country: string | null
  dob: Timestamp | null
  rank: UserRank | null
  favorites?: string[]
  statistics?: UserStatistics
  achievements: AchievementProgress[]
  level: number
  challenges?: Challenge[]
  googlePhotoURL?: string | null
  bio?: string
  progress: number
}

export interface UserStatistics {
  totalBeersRated: number
  countriesExplored: string[]
  beerTypeStats: { [key: string]: number }
  mostActiveDay: { date: string; count: number }
  registrationDate: Timestamp
  averageRating: number
  favoriteBrewery: string
  points: number
  lastRatingDate: Timestamp
  uniqueStylesCount: number
  uniqueCountriesCount: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon?: string
  dateUnlocked: Timestamp
}

export interface AchievementProgress {
  id: string
  name: string
  description: string
  icon: string
  levels: AchievementLevel[]
  currentLevel: number
  progress: number
  dateUnlocked: Timestamp
  updated?: boolean
}

export interface AchievementLevel {
  level: number
  requirement: number
  rewardXP: number
}

export interface UserRank {
  level: string
  name: string
  icon?: string
  points: number
  progress: number
  pointsToNextRank: number
}

export interface Challenge {
  id: string
  name: string
  description: string
  imageUrl: string
  reward: number
  completed: boolean
}

export interface RatedBeer {
  id: string
  beerId: string
  rating: number
  review?: string
  date: Timestamp
  name?: string
  beerLabelUrl?: string
  beerImageUrl?: string
  country?: string
  beerType?: string
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  photoURL?: string
  rank: UserRank
  points: number
}

export interface Reward {
  id: string
  name: string
  description: string
  imageUrl?: string
  dateEarned: Timestamp
}

export interface FavoriteBeer {
  id: string
  name: string
  beerLabelUrl?: string
  beerImageUrl?: string
}

