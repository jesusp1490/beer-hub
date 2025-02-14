import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import firebase from "firebase/compat/app"
import { AngularFireStorage } from "@angular/fire/compat/storage"
import { Observable, of, from, combineLatest, forkJoin } from "rxjs"
import { map, switchMap, catchError, take, tap } from "rxjs/operators"
import { AuthService } from "./auth.service"
import { Beer } from "../components/beers/beers.interface"
import {
  UserProfile,
  RatedBeer,
  Achievement,
  UserRank,
  UserStatistics,
  LeaderboardEntry,
  Reward,
  FavoriteBeer,
} from "../models/user.model"
import { Timestamp } from "@angular/fire/firestore"
import { NotificationService } from "./notification.service"

interface RankLevel {
  name: string
  minXP: number
  maxXP: number
}

interface RankDefinition {
  name: string
  icon: string
  levels: RankLevel[]
}

@Injectable({
  providedIn: "root",
})
export class UserService {
  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  getCurrentUser(): Observable<UserProfile | null> {
    return this.authService.user$.pipe(
      switchMap((user): Observable<UserProfile | null> => {
        if (user) {
          return this.firestore
            .doc<UserProfile>(`users/${user.uid}`)
            .valueChanges()
            .pipe(map((profile) => profile || null))
        } else {
          return of(null)
        }
      }),
    )
  }

  getCurrentUserProfile(): Observable<UserProfile | null> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .doc<UserProfile>(`users/${user.uid}`)
            .valueChanges()
            .pipe(
              map((profile) => {
                if (profile) {
                  return {
                    ...profile,
                    uid: user.uid,
                  }
                }
                return null
              }),
              catchError((error) => {
                console.error("Error fetching user profile:", error)
                return of(null)
              }),
            )
        } else {
          return of(null)
        }
      }),
      catchError((error) => {
        console.error("Error in auth state:", error)
        return of(null)
      }),
    )
  }

  private initializeStatistics(statistics: UserStatistics | undefined): UserStatistics {
    const defaultStats: UserStatistics = {
      totalBeersRated: 0,
      countriesExplored: [],
      beerTypeStats: {},
      mostActiveDay: { date: "", count: 0 },
      registrationDate: Timestamp.now(),
      averageRating: 0,
      favoriteBrewery: "",
      points: 0,
      lastRatingDate: Timestamp.now(),
      uniqueStylesCount: 0,
      uniqueCountriesCount: 0,
    }
    return statistics ? { ...defaultStats, ...statistics } : defaultStats
  }

  private getDefaultRank(): UserRank {
    return {
      level: "I",
      points: 0,
      progress: 0,
      name: "Novice",
      pointsToNextRank: 10,
    }
  }

  updateUser(userId: string, data: Partial<UserProfile>): Promise<void> {
    return this.firestore.doc<UserProfile>(`users/${userId}`).update(data)
  }

  updateUserProfile(profile: Partial<UserProfile>): Observable<void> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (user) {
          return from(this.firestore.doc(`users/${user.uid}`).update(profile))
        } else {
          throw new Error("No authenticated user")
        }
      }),
    )
  }

  uploadProfilePicture(file: File): Observable<string> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (user) {
          const filePath = `profilePictures/${user.uid}`
          const fileRef = this.storage.ref(filePath)
          const task = this.storage.upload(filePath, file)

          return task.snapshotChanges().pipe(
            switchMap(() => fileRef.getDownloadURL()),
            switchMap((photoURL) => {
              return from(this.firestore.doc(`users/${user.uid}`).update({ photoURL })).pipe(map(() => photoURL))
            }),
          )
        } else {
          throw new Error("No authenticated user")
        }
      }),
    )
  }

  getUserStatistics(userId: string): Observable<UserProfile> {
    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        map((user) => {
          if (!user) throw new Error("User not found")
          return user
        }),
      )
  }

  getUserFavoriteBeers(): Observable<FavoriteBeer[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .collection(`users/${user.uid}/favorites`)
            .valueChanges({ idField: "id" })
            .pipe(
              switchMap((favorites: any[]) => {
                if (favorites.length === 0) {
                  return of([])
                }
                return combineLatest(
                  favorites.map((favorite) =>
                    this.firestore
                      .doc<Beer>(`beers/${favorite.id}`)
                      .valueChanges()
                      .pipe(
                        map((beer) => ({
                          id: favorite.id,
                          beerId: favorite.id, // Add this line
                          name: beer?.name || "Unknown Beer",
                          beerLabelUrl: beer?.beerLabelUrl || "",
                          beerImageUrl: beer?.beerImageUrl || "",
                        })),
                      ),
                  ),
                )
              }),
            )
        } else {
          return of([])
        }
      }),
    )
  }

  getUserRatedBeers(): Observable<RatedBeer[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([])
        }
        return this.firestore
          .collection<RatedBeer>(`users/${user.uid}/ratings`)
          .valueChanges({ idField: "id" })
          .pipe(
            switchMap((ratings) => {
              if (ratings.length === 0) {
                return of([])
              }
              return forkJoin(
                ratings.map((rating) =>
                  this.firestore
                    .doc<Beer>(`beers/${rating.id}`)
                    .valueChanges()
                    .pipe(
                      take(1),
                      map((beer) => ({
                        ...rating,
                        name: beer?.name || "Unknown Beer",
                        beerLabelUrl: beer?.beerLabelUrl || "",
                        beerImageUrl: beer?.beerImageUrl || "",
                        country: beer?.countryId || "",
                        beerType: beer?.beerType || "",
                      })),
                    ),
                ),
              )
            }),
          )
      }),
    )
  }

  calculatePoints(user: UserProfile): number {
    if (!user || !user.statistics) {
      return 0
    }
    let points = 0
    points += user.statistics.totalBeersRated || 0
    return points
  }

  updateUserStatistics(userId: string, newRating: RatedBeer): Observable<void> {
    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) throw new Error("User not found")

          const updatedStats = this.calculateUpdatedStatistics(user.statistics, newRating)

          return from(this.firestore.doc(`users/${userId}`).update({ statistics: updatedStats })).pipe(
            switchMap(() => this.updateUserRank(userId, updatedStats.points)),
            map(() => {}),
          )
        }),
      )
  }

  private calculateUpdatedStatistics(currentStats: UserStatistics | undefined, newRating: RatedBeer): UserStatistics {
    const updatedStats: UserStatistics = this.initializeStatistics(currentStats)
    updatedStats.totalBeersRated += 1
    if (newRating.country) {
      updatedStats.countriesExplored = Array.from(new Set([...updatedStats.countriesExplored, newRating.country]))
    }
    if (newRating.beerType) {
      updatedStats.beerTypeStats[newRating.beerType] = (updatedStats.beerTypeStats[newRating.beerType] || 0) + 1
    }

    const today = new Date().toISOString().split("T")[0]
    if (today === updatedStats.mostActiveDay?.date) {
      updatedStats.mostActiveDay.count += 1
    } else if (!updatedStats.mostActiveDay || updatedStats.mostActiveDay.count < 1) {
      updatedStats.mostActiveDay = { date: today, count: 1 }
    }

    updatedStats.points += 1
    updatedStats.lastRatingDate = Timestamp.now()
    updatedStats.uniqueStylesCount = Object.keys(updatedStats.beerTypeStats).length
    updatedStats.uniqueCountriesCount = updatedStats.countriesExplored.length

    return updatedStats
  }

  checkAndUpdateAchievements(userId: string): Observable<Achievement[]> {
    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) throw new Error("User not found")

          const newAchievements: Achievement[] = []
          const currentAchievements = user.achievements || []
          const stats = user.statistics || this.initializeStatistics(undefined)

          if (stats.totalBeersRated >= 1 && !currentAchievements.some((a) => a.id === "first_rater")) {
            newAchievements.push({
              id: "first_rater",
              name: "First Rater",
              description: "Rate your first beer",
              dateUnlocked: Timestamp.now(),
              icon: "star",
            })
          }

          if (stats.countriesExplored.length >= 3 && !currentAchievements.some((a) => a.id === "beer_explorer")) {
            newAchievements.push({
              id: "beer_explorer",
              name: "Beer Explorer",
              description: "Rate beers from 3 different countries",
              dateUnlocked: Timestamp.now(),
              icon: "public",
            })
          }

          if (newAchievements.length > 0) {
            const updatedAchievements = [...currentAchievements, ...newAchievements]
            return from(
              this.firestore.doc(`users/${userId}`).update({
                achievements: updatedAchievements,
              }),
            ).pipe(
              tap(() => {
                newAchievements.forEach((achievement) => {
                  this.notificationService.addNotification(
                    `New achievement unlocked: ${achievement.name}!`,
                    "achievement",
                  )
                })
              }),
              map(() => updatedAchievements),
            )
          }

          return of(currentAchievements)
        }),
      )
  }

  updateUserRank(userId: string, currentPoints?: number): Observable<UserRank> {
    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) throw new Error("User not found")

          const points = currentPoints !== undefined ? currentPoints : user.statistics?.points || 0
          const newRank: UserRank = this.calculateRank(points)

          if (!user.rank || newRank.level !== user.rank.level) {
            return from(this.firestore.doc(`users/${userId}`).update({ rank: newRank })).pipe(
              tap(() => {
                this.notificationService.addNotification(`Congratulations! You've reached ${newRank.name}!`, "rank")
              }),
              map(() => newRank),
            )
          }

          return of(newRank)
        }),
      )
  }

  private readonly rankDefinitions: RankDefinition[] = [
    {
      name: "Beer Recruit",
      icon: "🍺",
      levels: [
        { name: "I", minXP: 0, maxXP: 19 },
        { name: "II", minXP: 20, maxXP: 39 },
        { name: "III", minXP: 40, maxXP: 59 },
      ],
    },
    {
      name: "Hop Private",
      icon: "🌿",
      levels: [
        { name: "I", minXP: 60, maxXP: 99 },
        { name: "II", minXP: 100, maxXP: 139 },
        { name: "III", minXP: 140, maxXP: 179 },
      ],
    },
    {
      name: "Malt Corporal",
      icon: "🌾",
      levels: [
        { name: "I", minXP: 180, maxXP: 249 },
        { name: "II", minXP: 250, maxXP: 319 },
        { name: "III", minXP: 320, maxXP: 399 },
      ],
    },
    {
      name: "Ale Sergeant",
      icon: "🍺",
      levels: [
        { name: "I", minXP: 400, maxXP: 499 },
        { name: "II", minXP: 500, maxXP: 599 },
        { name: "III", minXP: 600, maxXP: 699 },
      ],
    },
    {
      name: "Lager Lieutenant",
      icon: "🍻",
      levels: [
        { name: "I", minXP: 700, maxXP: 849 },
        { name: "II", minXP: 850, maxXP: 999 },
        { name: "III", minXP: 1000, maxXP: 1199 },
      ],
    },
    {
      name: "Stout Captain",
      icon: "🍻",
      levels: [
        { name: "I", minXP: 1200, maxXP: 1399 },
        { name: "II", minXP: 1400, maxXP: 1599 },
        { name: "III", minXP: 1600, maxXP: 1799 },
      ],
    },
    {
      name: "Porter Colonel",
      icon: "🏆",
      levels: [
        { name: "I", minXP: 1800, maxXP: 1999 },
        { name: "II", minXP: 2000, maxXP: 2199 },
        { name: "III", minXP: 2200, maxXP: 2499 },
      ],
    },
    {
      name: "Imperial General",
      icon: "👑",
      levels: [
        { name: "I", minXP: 2500, maxXP: 2799 },
        { name: "II", minXP: 2800, maxXP: 3099 },
        { name: "III", minXP: 3100, maxXP: 3499 },
      ],
    },
    {
      name: "Grand Brewmaster",
      icon: "🏆",
      levels: [
        { name: "I", minXP: 3500, maxXP: 3999 },
        { name: "II", minXP: 4000, maxXP: 4499 },
        { name: "III", minXP: 4500, maxXP: Number.POSITIVE_INFINITY },
      ],
    },
  ]

  private calculateRank(points: number): UserRank {
    let currentRank: RankDefinition | undefined
    let currentLevel: RankLevel | undefined

    // Find the appropriate rank and level based on points
    for (const rank of this.rankDefinitions) {
      for (const level of rank.levels) {
        if (points >= level.minXP && points <= level.maxXP) {
          currentRank = rank
          currentLevel = level
          break
        }
      }
      if (currentRank && currentLevel) break
    }

    // If no rank found (shouldn't happen), use first rank level I
    if (!currentRank || !currentLevel) {
      currentRank = this.rankDefinitions[0]
      currentLevel = currentRank.levels[0]
    }

    // Calculate progress within current level
    const levelProgress = ((points - currentLevel.minXP) / (currentLevel.maxXP - currentLevel.minXP)) * 100
    const pointsToNextRank = currentLevel.maxXP - points

    return {
      name: currentRank.name,
      icon: currentRank.icon,
      level: currentLevel.name,
      progress: Math.min(levelProgress, 100),
      pointsToNextRank: Math.max(pointsToNextRank, 0),
      points: points,
    }
  }

  private getNextLevel(ranks: any[], currentRank: any, currentLevel: any): any {
    const currentRankIndex = ranks.indexOf(currentRank)
    const currentLevelIndex = currentRank.levels.indexOf(currentLevel)

    if (currentLevelIndex < currentRank.levels.length - 1) {
      return currentRank.levels[currentLevelIndex + 1]
    } else if (currentRankIndex < ranks.length - 1) {
      return ranks[currentRankIndex + 1].levels[0]
    }
    return null
  }

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([])
        }
        const query = this.firestore.collection("users", (ref) => ref.orderBy("statistics.points", "desc").limit(10))
        return query.valueChanges({ idField: "userId" }).pipe(
          map((users) =>
            users.map((user: any) => ({
              userId: user.userId,
              displayName: user.displayName || "Anonymous",
              photoURL: user.photoURL,
              rank: this.calculateRank(user.statistics?.points || 0),
              points: user.statistics?.points || 0,
            })),
          ),
        )
      }),
    )
  }

  addReward(userId: string, reward: Reward): Promise<void> {
    return this.firestore.doc(`users/${userId}`).update({
      rewards: firebase.firestore.FieldValue.arrayUnion(reward),
    })
  }

  shareAchievement(userId: string, achievementId: string): Promise<void> {
    console.log(`Sharing achievement ${achievementId} for user ${userId}`)
    return Promise.resolve()
  }

  // Add this new method to recalculate points and fix ranks
  recalculateUserPoints(userId: string): Observable<void> {
    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) throw new Error("User not found")

          // Calculate total points based on all actions
          let totalPoints = 0

          // Points from beer ratings (1 XP each)
          totalPoints += user.statistics?.totalBeersRated || 0

          // Points from achievements (based on level)
          user.achievements?.forEach((achievement) => {
            if (achievement.id.includes("bronze")) totalPoints += 10
            if (achievement.id.includes("silver")) totalPoints += 25
            if (achievement.id.includes("gold")) totalPoints += 50
          })

          // Update user statistics with new points
          const updatedStats: UserStatistics = {
            ...(user.statistics || this.initializeStatistics(undefined)),
            points: totalPoints,
          }

          // Calculate new rank based on total points
          const newRank = this.calculateRank(totalPoints)

          // Update both statistics and rank in the database
          return from(
            this.firestore.doc(`users/${userId}`).update({
              statistics: updatedStats,
              rank: newRank,
            }),
          )
        }),
      )
  }

  // Update the point calculation for different actions
  addPoints(
    userId: string,
    action: "rate" | "request" | "add" | "review" | "challenge" | "achievement",
    level?: "bronze" | "silver" | "gold",
  ): Observable<void> {
    const pointsMap = {
      rate: 1, // Rating a beer
      request: 3, // Requesting a new beer
      add: 5, // Adding a new beer to database
      review: 2, // Writing a detailed review
      challenge: 10, // Basic challenge completion
      achievement: level === "bronze" ? 10 : level === "silver" ? 25 : 50, // Achievement points
    }

    const points = pointsMap[action]

    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) throw new Error("User not found")

          const currentPoints = user.statistics?.points || 0
          const newPoints = currentPoints + points

          // Update statistics with new points
          const updatedStats: UserStatistics = {
            ...(user.statistics || this.initializeStatistics(undefined)),
            points: newPoints,
          }

          // Calculate new rank based on total points
          const newRank = this.calculateRank(newPoints)

          // Update both statistics and rank
          return from(
            this.firestore.doc(`users/${userId}`).update({
              statistics: updatedStats,
              rank: newRank,
            }),
          )
        }),
      )
  }

  // Update the rate beer method to add points
  rateBeer(userId: string, beerId: string, rating: number, review?: string): Observable<void> {
    return this.addPoints(userId, "rate").pipe(
      switchMap(() => {
        if (review && review.length >= 50) {
          // If detailed review
          return this.addPoints(userId, "review")
        }
        return of(void 0)
      }),
    )
  }

  // Update the request new beer method to add points
  requestNewBeer(userId: string, beerDetails: any): Observable<void> {
    return this.addPoints(userId, "request")
  }

  // Update the add new beer method to add points
  addNewBeer(userId: string, beerDetails: any): Observable<void> {
    return this.addPoints(userId, "add")
  }

  // Update challenge completion to add points
  completeChallenge(userId: string, challengeId: string): Observable<void> {
    return this.addPoints(userId, "challenge")
  }

  // ... (rest of the code remains the same)
}

