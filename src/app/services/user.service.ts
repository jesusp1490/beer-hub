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
import firebase from "firebase/compat/app"
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

  // FIX: previously fired one Firestore read PER favorited beer (N+1 reads).
  // Firestore's `in` query lets us fetch up to 30 documents by ID in a single
  // query, so we batch favorite IDs into chunks of 30 instead. For a typical
  // dashboard (a handful to a few dozen favorites) this turns N reads into 1-2.
  getUserFavoriteBeers(): Observable<FavoriteBeer[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([])
        }
        return this.firestore
          .collection(`users/${user.uid}/favorites`)
          .valueChanges({ idField: "id" })
          .pipe(
            switchMap((favorites: any[]) => {
              if (favorites.length === 0) {
                return of([])
              }
              const beerIds = favorites.map((f) => f.id)
              return this.getBeersByIds(beerIds).pipe(
                map((beers) => {
                  const beerMap = new Map(beers.map((b) => [b.id, b]))
                  return favorites.map((favorite) => {
                    const beer = beerMap.get(favorite.id)
                    return {
                      id: favorite.id,
                      beerId: favorite.id,
                      name: beer?.name || "Unknown Beer",
                      beerLabelUrl: beer?.beerLabelUrl || "",
                      beerImageUrl: beer?.beerImageUrl || "",
                    }
                  })
                }),
              )
            }),
          )
      }),
    )
  }

  // FIX: same N+1 problem as getUserFavoriteBeers — batched via getBeersByIds.
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
              const beerIds = ratings.map((r) => r.id)
              return this.getBeersByIds(beerIds).pipe(
                map((beers) => {
                  const beerMap = new Map(beers.map((b) => [b.id, b]))
                  return ratings.map((rating) => {
                    const beer = beerMap.get(rating.id)
                    return {
                      ...rating,
                      name: beer?.name || "Unknown Beer",
                      beerLabelUrl: beer?.beerLabelUrl || "",
                      beerImageUrl: beer?.beerImageUrl || "",
                      country: beer?.countryId || "",
                      beerType: beer?.beerType || "",
                    }
                  })
                }),
              )
            }),
          )
      }),
    )
  }

  // Fetches beer docs by ID in batches of 30 (Firestore's max for `in` queries)
  // and combines the results. Falls back to an empty array for an empty input.
  private getBeersByIds(beerIds: string[]): Observable<Beer[]> {
    if (beerIds.length === 0) {
      return of([])
    }

    const chunkSize = 30
    const chunks: string[][] = []
    for (let i = 0; i < beerIds.length; i += chunkSize) {
      chunks.push(beerIds.slice(i, i + chunkSize))
    }

    const chunkQueries = chunks.map((chunk) =>
      this.firestore
        .collection<Beer>("beers", (ref) => ref.where(firebase.firestore.FieldPath.documentId(), "in", chunk))
        .valueChanges({ idField: "id" })
        .pipe(take(1)),
    )

    return forkJoin(chunkQueries).pipe(map((results) => results.flat()))
  }

  calculatePoints(user: UserProfile): number {
    if (!user || !user.statistics) {
      return 0
    }
    let points = 0
    points += user.statistics.totalBeersRated || 0
    return points
  }

  // FIX: previously this read the user doc, computed updated stats in JS, then
  // wrote it back with a plain .update() — a classic read-then-write race.
  // If two rating actions happen close together (e.g. rating a beer while an
  // achievement check is also updating the doc), the second write could
  // silently overwrite the first based on stale data. Wrapping the whole
  // read+compute+write in a Firestore transaction guarantees the read and
  // write are atomic relative to other writes to the same document.
  updateUserStatistics(userId: string, newRating: RatedBeer): Observable<void> {
    const userRef = this.firestore.doc(`users/${userId}`).ref

    return from(
      this.firestore.firestore.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef)
        if (!userDoc.exists) throw new Error("User not found")

        const user = userDoc.data() as UserProfile
        const updatedStats = this.calculateUpdatedStatistics(user.statistics, newRating)

        transaction.update(userRef, { statistics: updatedStats })
        return updatedStats
      }),
    ).pipe(
      switchMap((updatedStats) => this.updateUserRank(userId, updatedStats.points)),
      map(() => undefined),
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

  // FIX: wrapped in a transaction so the rank read+write is atomic relative to
  // other concurrent writes on the same user doc (e.g. addPoints firing at the
  // same time). Previously this used valueChanges().pipe(take(1)) followed by
  // a separate .update() call — also a read-then-write race.
  updateUserRank(userId: string, currentPoints?: number): Observable<UserRank> {
    const userRef = this.firestore.doc(`users/${userId}`).ref

    return from(
      this.firestore.firestore.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef)
        if (!userDoc.exists) throw new Error("User not found")

        const user = userDoc.data() as UserProfile
        const points = currentPoints !== undefined ? currentPoints : user.statistics?.points || 0
        const newRank: UserRank = this.calculateRank(points)
        const rankChanged = !user.rank || newRank.level !== user.rank.level

        if (rankChanged) {
          transaction.update(userRef, { rank: newRank })
        }

        return { newRank, rankChanged }
      }),
    ).pipe(
      tap(({ newRank, rankChanged }) => {
        if (rankChanged) {
          this.notificationService.addNotification(`Congratulations! You've reached ${newRank.name}!`, "rank")
        }
      }),
      map(({ newRank }) => newRank),
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

  // NEW: country-scoped leaderboard, complementing the existing global one.
  // Used by the dashboard's "Country" tab — previously LeaderboardComponent
  // had a @Input for this but nothing ever populated it.
  getCountryLeaderboard(country: string): Observable<LeaderboardEntry[]> {
    if (!country) {
      return of([])
    }
    const query = this.firestore.collection("users", (ref) =>
      ref.where("country", "==", country).orderBy("statistics.points", "desc").limit(10),
    )
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
      catchError((error) => {
        console.error("Error fetching country leaderboard:", error)
        return of([])
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

  // FIX: wrapped in a transaction — previously read-then-wrote the user doc
  // outside a transaction, same race risk as addPoints/updateUserStatistics.
  recalculateUserPoints(userId: string): Observable<void> {
    const userRef = this.firestore.doc(`users/${userId}`).ref

    return from(
      this.firestore.firestore.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef)
        if (!userDoc.exists) throw new Error("User not found")

        const user = userDoc.data() as UserProfile
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

        transaction.update(userRef, { statistics: updatedStats, rank: newRank })
      }),
    )
  }

  // FIX: wrapped in a transaction for the same reason as above. This is the
  // method called every time a user rates a beer, requests a beer, etc., so
  // it's also the one most likely to race against a concurrent action.
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
    const userRef = this.firestore.doc(`users/${userId}`).ref

    return from(
      this.firestore.firestore.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef)
        if (!userDoc.exists) throw new Error("User not found")

        const user = userDoc.data() as UserProfile
        const currentPoints = user.statistics?.points || 0
        const newPoints = currentPoints + points

        const updatedStats: UserStatistics = {
          ...(user.statistics || this.initializeStatistics(undefined)),
          points: newPoints,
        }
        const newRank = this.calculateRank(newPoints)

        transaction.update(userRef, { statistics: updatedStats, rank: newRank })
      }),
    )
  }

  // FIX: wrapped in a transaction — same race as the others.
  removeBeerRating(userId: string, beerId: string): Observable<void> {
    const userRef = this.firestore.doc(`users/${userId}`).ref

    return from(
      this.firestore.firestore.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef)
        if (!userDoc.exists) throw new Error("User not found")

        const user = userDoc.data() as UserProfile
        const ratedBeers = user.ratedBeers || []
        const ratingToRemove = ratedBeers.find((rb) => rb.beerId === beerId)

        if (!ratingToRemove) {
          console.log("Rating not found")
          return { statsPoints: user.statistics?.points || 0 }
        }

        const updatedRatedBeers = ratedBeers.filter((rb) => rb.beerId !== beerId)
        const pointsToDeduct = this.calculatePointsForRating(ratingToRemove)

        const updatedStats = this.calculateUpdatedStatisticsAfterRemoval(
          user.statistics || this.initializeStatistics(undefined),
          ratingToRemove,
        )
        updatedStats.points = Math.max(0, (updatedStats.points || 0) - pointsToDeduct)

        transaction.update(userRef, {
          ratedBeers: updatedRatedBeers,
          statistics: updatedStats,
        })

        return { statsPoints: updatedStats.points }
      }),
    ).pipe(
      switchMap(({ statsPoints }) => this.updateUserRank(userId, statsPoints)),
      switchMap(() => this.achievementService.updateAchievements(userId)),
      map(() => undefined),
    )
  }

  private calculatePointsForRating(rating: Partial<RatedBeer>): number {
    let points = 1
    if (rating.review && rating.review.length >= 50) {
      points += 2
    }
    return points
  }

  private calculateUpdatedStatisticsAfterRemoval(
    currentStats: UserStatistics,
    removedRating: RatedBeer,
  ): UserStatistics {
    const updatedStats = { ...currentStats }
    updatedStats.totalBeersRated = Math.max(0, (updatedStats.totalBeersRated || 0) - 1)

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
      Europe: ["Czechia", "Germany", "France", "Italy", "Spain", "United Kingdom"],
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

  // NOTE: these four helpers are currently unused (always return false / a
  // hardcoded list) and the stats fields they'd feed (rareBeersRated,
  // craftBeersRated, highHopBeersRated, highAltitudeCountriesExplored) are
  // initialized but never actually incremented anywhere. Left in place since
  // removing them might be a breaking change if referenced elsewhere (e.g.
  // achievement.service.ts), but worth deciding: either wire these up to
  // real beer-data lookups, or remove them + the corresponding dashboard UI
  // so you're not displaying permanently-zero stats.
  private isHighAltitudeCountry(country: string): boolean {
    const highAltitudeCountries = ["Bolivia", "Peru", "Nepal", "Bhutan"]
    return highAltitudeCountries.includes(country)
  }

  private isRareBeer(beerId: string): boolean {
    return false
  }

  private isCraftBeer(beerId: string): boolean {
    return false
  }

  private isHighHopBeer(beerId: string): boolean {
    return false
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
