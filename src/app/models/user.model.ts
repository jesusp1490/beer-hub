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
  achievements?: Record<string, UserAchievement>
  rewards?: Reward[]
  level: number
  challenges?: Challenge[]
  googlePhotoURL?: string | null
  bio?: string
  progress: number
  ratedBeers?: RatedBeer[]
  settings?: UserSettings
  notifications?: UserNotifications
}

export interface UserSettings {
  darkMode: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  language: string
}

export interface UserNotifications {
  newBeerAdded: boolean
  newChallenge: boolean
  newReward: boolean
  weeklySummary: boolean
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
  totalReviews: number
  totalReviewLikes: number
  newBeerRequests: number
  detailedReviews: number
  reputationPoints: number
  continentsExplored: string[]
  europeanCountriesExplored: string[]
  northAmericanCountriesExplored: string[]
  southAmericanCountriesExplored: string[]
  asianBeersRated: number
  africanBeersRated: number
  oceaniaBeersRated: number
  highAltitudeCountriesExplored: string[]
  rareBeersRated: number
  craftBeersRated: number
  highHopBeersRated: number
  totalBadgesEarned: number
}

export interface UserAchievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  levels: AchievementLevel[]
  currentLevel: number
  progress: number
  completed: boolean
  dateUnlocked?: Timestamp | null
}

export interface AchievementLevel {
  level: number
  requirement: number
  rewardXP: number
  icon: string
  description: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  levels: AchievementLevel[]
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
  photoURL: string
  rank: UserRank
  points: number
}

export interface Reward {
  id: string
  name: string
  description: string
  icon: string
  dateEarned: Timestamp
  type: string
}

export interface FavoriteBeer {
  id: string
  beerId: string
  name: string
  beerLabelUrl?: string
  beerImageUrl?: string
}

