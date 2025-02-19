import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { AngularFireStorage } from "@angular/fire/compat/storage"
import { Observable, of, from, combineLatest, forkJoin } from "rxjs"
import { map, switchMap, catchError, take, tap } from "rxjs/operators"
import { AuthService } from "./auth.service"
import { Beer } from "../components/beers/beers.interface"
import {
  UserProfile,
  RatedBeer,
  UserRank,
  UserStatistics,
  LeaderboardEntry,
  Reward,
  FavoriteBeer,
  UserAchievement,
} from "../models/user.model"
import { Timestamp, arrayUnion } from "@angular/fire/firestore"
import { NotificationService } from "./notification.service"
import { AchievementService } from "./achievement.service"

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
    private achievementService: AchievementService,
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
      totalReviews: 0,
      totalReviewLikes: 0,
      newBeerRequests: 0,
      detailedReviews: 0,
      reputationPoints: 0,
      continentsExplored: [],
      europeanCountriesExplored: [],
      northAmericanCountriesExplored: [],
      southAmericanCountriesExplored: [],
      asianBeersRated: 0,
      africanBeersRated: 0,
      oceaniaBeersRated: 0,
      highAltitudeCountriesExplored: [],
      rareBeersRated: 0,
      craftBeersRated: 0,
      highHopBeersRated: 0,
      totalBadgesEarned: 0,
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
                          beerId: favorite.id,
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
      this.updateContinentStatistics(updatedStats, newRating.country)
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

  rateBeer(
    userId: string,
    beerId: string,
    rating: number,
    review: string | undefined,
    beerType: string,
    country: string,
  ): Observable<void> {
    return this.addPoints(userId, "rate").pipe(
      switchMap(() => {
        if (review && review.length >= 50) {
          return this.addPoints(userId, "review")
        }
        return of(void 0)
      }),
      switchMap(() => {
        const ratedBeer: RatedBeer = {
          id: this.firestore.createId(),
          beerId,
          rating,
          review: review || "",
          date: Timestamp.now(),
          country: country,
          beerType: beerType,
        }
        return this.updateUserStatistics(userId, ratedBeer)
      }),
      switchMap(() => this.achievementService.updateAchievements(userId)),
      map(() => undefined),
    )
  }

  requestNewBeer(userId: string, beerDetails: any): Observable<void> {
    return this.addPoints(userId, "request")
  }

  addNewBeer(userId: string, beerDetails: any): Observable<void> {
    return this.addPoints(userId, "add")
  }

  completeChallenge(userId: string, challengeId: string): Observable<void> {
    return this.addPoints(userId, "challenge")
  }

  getUserAchievements(userId: string): Observable<UserAchievement[]> {
    return this.firestore.collection<UserAchievement>(`users/${userId}/achievements`).valueChanges({ idField: "id" })
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

    if (!currentRank || !currentLevel) {
      currentRank = this.rankDefinitions[0]
      currentLevel = currentRank.levels[0]
    }

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

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([])
        }
        const query = this.firestore.collection("users", (ref) => ref.orderBy("statistics.points", "desc").limit(10))
        return query.valueChanges({ idField: "userId" }).pipe(
          map((users: any[]) =>
            users.map((user) => ({
              userId: user.userId,
              displayName: user.displayName || "Anonymous",
              photoURL: user.photoURL || "",
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
      rewards: arrayUnion(reward),
    })
  }

  shareAchievement(userId: string, achievementId: string): Promise<void> {
    console.log(`Sharing achievement ${achievementId} for user ${userId}`)
    return Promise.resolve()
  }

  recalculateUserPoints(userId: string): Observable<void> {
    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) throw new Error("User not found")

          let totalPoints = 0

          totalPoints += user.statistics?.totalBeersRated || 0

          if (user.achievements) {
            Object.values(user.achievements as Record<string, UserAchievement>).forEach((achievement) => {
              if (achievement.currentLevel === 1) totalPoints += 10
              if (achievement.currentLevel === 2) totalPoints += 25
              if (achievement.currentLevel === 3) totalPoints += 50
            })
          }

          const updatedStats: UserStatistics = {
            ...(user.statistics || this.initializeStatistics(undefined)),
            points: totalPoints,
          }

          const newRank = this.calculateRank(totalPoints)

          return from(
            this.firestore.doc(`users/${userId}`).update({
              statistics: updatedStats,
              rank: newRank,
            }),
          )
        }),
        map(() => undefined),
      )
  }

  addPoints(
    userId: string,
    action: "rate" | "request" | "add" | "review" | "challenge" | "achievement",
    customPoints?: number,
    level?: "bronze" | "silver" | "gold",
  ): Observable<void> {
    const pointsMap = {
      rate: 1,
      request: 3,
      add: 5,
      review: 2,
      challenge: 10,
      achievement: level === "bronze" ? 10 : level === "silver" ? 25 : 50,
    }

    const points = customPoints !== undefined ? customPoints : pointsMap[action]

    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) throw new Error("User not found")

          const currentPoints = user.statistics?.points || 0
          const newPoints = currentPoints + points

          const updatedStats: UserStatistics = {
            ...(user.statistics || this.initializeStatistics(undefined)),
            points: newPoints,
          }

          const newRank = this.calculateRank(newPoints)

          return from(
            this.firestore.doc(`users/${userId}`).update({
              statistics: updatedStats,
              rank: newRank,
            }),
          )
        }),
      )
  }

  removeBeerRating(userId: string, beerId: string): Observable<void> {
    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) throw new Error("User not found")

          const ratedBeers = user.ratedBeers || []
          const ratingToRemove = ratedBeers.find((rb) => rb.beerId === beerId)

          if (!ratingToRemove) {
            console.log("Rating not found")
            return of(undefined)
          }

          const updatedRatedBeers = ratedBeers.filter((rb) => rb.beerId !== beerId)
          const pointsToDeduct = this.calculatePointsForRating(ratingToRemove)

          const updatedStats = this.calculateUpdatedStatisticsAfterRemoval(
            user.statistics || this.initializeStatistics(undefined),
            ratingToRemove,
          )
          updatedStats.points = Math.max(0, (updatedStats.points || 0) - pointsToDeduct)

          return from(
            this.firestore.doc(`users/${userId}`).update({
              ratedBeers: updatedRatedBeers,
              statistics: updatedStats,
            }),
          ).pipe(
            switchMap(() => this.updateUserRank(userId, updatedStats.points)),
            switchMap(() => this.achievementService.updateAchievements(userId)),
          )
        }),
      )
  }

  private calculatePointsForRating(rating: Partial<RatedBeer>): number {
    let points = 1 // Base point for rating
    if (rating.review && rating.review.length >= 50) {
      points += 2 // Additional points for review
    }
    return points
  }

  private calculateUpdatedStatisticsAfterRemoval(
    currentStats: UserStatistics,
    removedRating: RatedBeer,
  ): UserStatistics {
    const updatedStats = { ...currentStats }
    updatedStats.totalBeersRated = Math.max(0, (updatedStats.totalBeersRated || 0) - 1)

    // Update other statistics as needed
    if (removedRating.country) {
      const countryCount = updatedStats.countriesExplored.filter((c) => c === removedRating.country).length
      if (countryCount === 1) {
        updatedStats.countriesExplored = updatedStats.countriesExplored.filter((c) => c !== removedRating.country)
        updatedStats.uniqueCountriesCount = Math.max(0, (updatedStats.uniqueCountriesCount || 0) - 1)
      }
      this.updateContinentStatistics(updatedStats, removedRating.country)
    }

    if (removedRating.beerType) {
      updatedStats.beerTypeStats[removedRating.beerType] = Math.max(
        0,
        (updatedStats.beerTypeStats[removedRating.beerType] || 0) - 1,
      )
      if (updatedStats.beerTypeStats[removedRating.beerType] === 0) {
        delete updatedStats.beerTypeStats[removedRating.beerType]
        updatedStats.uniqueStylesCount = Math.max(0, (updatedStats.uniqueStylesCount || 0) - 1)
      }
    }

    if (updatedStats.totalReviews !== undefined) {
      updatedStats.totalReviews = Math.max(0, updatedStats.totalReviews - 1)
    }

    // Recalculate average rating
    const totalRatings = updatedStats.totalBeersRated || 0
    if (totalRatings > 0) {
      const totalRatingSum = (currentStats.averageRating || 0) * (totalRatings + 1) - removedRating.rating
      updatedStats.averageRating = totalRatingSum / totalRatings
    } else {
      updatedStats.averageRating = 0
    }

    return updatedStats
  }

  private updateContinentStatistics(stats: UserStatistics, country: string): void {
    const continents: { [key: string]: string[] } = {
      Europe: ["Czechia", "Germany", "France", "Italy", "Spain", "United Kingdom", ],
      NorthAmerica: ["United States of America", "Canada", "Mexico"],
      SouthAmerica: ["Brazil", "Argentina", "Colombia"],
      Asia: ["China", "Japan", "India"],
      Africa: ["Egypt", "Nigeria", "South Africa"],
      Oceania: ["Australia", "New Zealand"],
    }

    for (const [continent, countries] of Object.entries(continents)) {
      if (countries.includes(country)) {
        stats.continentsExplored = Array.from(new Set([...stats.continentsExplored, continent]))
        break
      }
    }
  }

  private isHighAltitudeCountry(country: string): boolean {
    const highAltitudeCountries = ["Bolivia", "Peru", "Nepal", "Bhutan"] // Add more high-altitude countries
    return highAltitudeCountries.includes(country)
  }

  private isRareBeer(beerId: string): boolean {
    // Implement logic to check if a beer is rare based on beerId
    // This might involve fetching data from a database or external API
    return false // Replace with actual logic
  }

  private isCraftBeer(beerId: string): boolean {
    // Implement logic to check if a beer is craft based on beerId
    // This might involve fetching data from a database or external API
    return false // Replace with actual logic
  }

  private isHighHopBeer(beerId: string): boolean {
    // Implement logic to check if a beer is high hop based on beerId
    // This might involve fetching data from a database or external API
    return false // Replace with actual logic
  }

  private checkNewlyUnlockedAchievements(oldAchievements: UserAchievement[], newAchievements: UserAchievement[]): void {
    newAchievements.forEach((newAchievement) => {
      const oldAchievement = oldAchievements.find((a) => a.id === newAchievement.id)
      if (!oldAchievement || newAchievement.currentLevel > oldAchievement.currentLevel) {
        this.notificationService.addNotification(
          `Achievement Unlocked: ${newAchievement.name} (Level ${newAchievement.currentLevel})`,
          "achievement",
        )
      }
    })
  }
}

