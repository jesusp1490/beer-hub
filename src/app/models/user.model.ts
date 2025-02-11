import type { Timestamp } from "firebase/firestore"

export interface UserProfile {
  uid: string
  email: string
  emailVerified: boolean
  displayName: string
  username?: string
  firstName?: string
  lastName?: string
  photoURL?: string
  country?: string
  dob?: Timestamp
  favorites?: string[]
  statistics: UserStatistics
  achievements: Achievement[]
  rank: UserRank
  challenges?: Challenge[]
  googlePhotoURL?: string | null
  bio?: string // Added bio field
}

export interface UserStatistics {
  totalBeersRated: number
  countriesExplored: string[]
  beerTypeStats: { [key: string]: number }
  mostActiveDay: { date: string; count: number }
  registrationDate: Timestamp
  points: number
  lastRatingDate: Timestamp
  uniqueStyles: number
  uniqueCountries: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon?: string
  dateUnlocked?: Timestamp
  progress?: number
  threshold?: number
}

export interface UserRank {
  level: number
  name: string
  icon?: string
  points: number
  progress: number
}

export interface Challenge {
  id: string
  name: string
  description: string
  progress: number
  threshold: number
  completed: boolean
  icon?: string
  reward?: string
}

export interface RatedBeer {
  beerId: string
  rating: number
  review?: string
  date: Timestamp
  country?: string
  beerType?: string
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  photoURL?: string
  rank: UserRank
  points: number
  country?: string
}

export interface BeerRequest {
  name: string
  description: string
  createdAt: Timestamp
  userId: string
  userEmail: string
  status?: "pending" | "approved" | "rejected"
}

export interface Notification {
  id: string
  message: string
  type: string
  timestamp: Timestamp
  read: boolean
}

export interface Reward {
  id: string
  name: string
  description: string
  imageUrl?: string
  dateEarned?: Timestamp
}

export interface FavoriteBeer {
  id: string
  name: string
  beerLabelUrl: string
  beerImageUrl: string
}

