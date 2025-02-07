import type { Timestamp } from "@angular/fire/firestore"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string
  firstName: string
  lastName: string
  username: string
  country: string
  dob: Timestamp | null
  statistics: UserStatistics
  achievements: Achievement[]
  rank: UserRank
}

export interface UserStatistics {
  totalBeersRated: number
  countriesExplored: string[]
  beerTypeStats: { [key: string]: number }
  mostActiveDay: {
    date: string
    count: number
  }
  registrationDate: Timestamp
  points: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: Timestamp
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

export interface FavoriteBeer {
  id: string
  name: string
  beerLabelUrl: string
  beerImageUrl: string
}

export interface RatedBeer {
  id: string
  name: string
  rating: number
  ratedAt: Timestamp
  country: string
  beerType: string
  beerLabelUrl?: string
  beerImageUrl?: string
}

