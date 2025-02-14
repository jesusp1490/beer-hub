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
      level: 0,
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

          // Check for new achievements
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

  private calculateRank(ratings: number): UserRank {
    const ranks = [
      {
        name: "Beer Recruit",
        icon: "🍺",
        levels: [
          { name: "I", min: 0, max: 20 },
          { name: "II", min: 21, max: 40 },
          { name: "III", min: 41, max: 60 },
        ],
      },
      {
        name: "Hop Private",
        icon: "🌿",
        levels: [
          { name: "I", min: 61, max: 100 },
          { name: "II", min: 101, max: 140 },
          { name: "III", min: 141, max: 180 },
        ],
      },
      {
        name: "Malt Corporal",
        icon: "🌾",
        levels: [
          { name: "I", min: 181, max: 250 },
          { name: "II", min: 251, max: 320 },
          { name: "III", min: 321, max: 400 },
        ],
      },
      {
        name: "Ale Sergeant",
        icon: "🍺",
        levels: [
          { name: "I", min: 401, max: 500 },
          { name: "II", min: 501, max: 600 },
          { name: "III", min: 601, max: 700 },
        ],
      },
      {
        name: "Lager Lieutenant",
        icon: "🛢",
        levels: [
          { name: "I", min: 701, max: 850 },
          { name: "II", min: 851, max: 1000 },
          { name: "III", min: 1001, max: 1200 },
        ],
      },
      {
        name: "Stout Captain",
        icon: "🍻",
        levels: [
          { name: "I", min: 1201, max: 1400 },
          { name: "II", min: 1401, max: 1600 },
          { name: "III", min: 1601, max: 1800 },
        ],
      },
      {
        name: "Porter Colonel",
        icon: "🛢",
        levels: [
          { name: "I", min: 1801, max: 2000 },
          { name: "II", min: 2001, max: 2200 },
          { name: "III", min: 2201, max: 2500 },
        ],
      },
      {
        name: "Imperial General",
        icon: "👑",
        levels: [
          { name: "I", min: 2501, max: 2800 },
          { name: "II", min: 2801, max: 3100 },
          { name: "III", min: 3101, max: 3500 },
        ],
      },
      {
        name: "Grand Brewmaster",
        icon: "🏆",
        levels: [
          { name: "I", min: 3501, max: 4000 },
          { name: "II", min: 4001, max: 4500 },
          { name: "III", min: 4501, max: Number.POSITIVE_INFINITY },
        ],
      },
    ]

    let currentRank = ranks[0]
    let currentLevel = currentRank.levels[0]

    for (const rank of ranks) {
      for (const level of rank.levels) {
        if (ratings >= level.min && ratings <= level.max) {
          currentRank = rank
          currentLevel = level
          break
        }
      }
      if (currentRank === rank) break
    }

    const nextLevel = this.getNextLevel(ranks, currentRank, currentLevel)
    const progress = (ratings - currentLevel.min) / (currentLevel.max - currentLevel.min)
    const pointsToNextRank = nextLevel ? nextLevel.min - ratings : 0

    return {
      name: `${currentRank.name} ${currentLevel.name}`,
      icon: currentRank.icon,
      level: Number.parseInt(currentLevel.name.replace("I", "1").replace("II", "2").replace("III", "3")),
      progress: progress,
      pointsToNextRank: pointsToNextRank,
      points: ratings,
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
    // Implement social media sharing logic here
    // This is a placeholder function
    console.log(`Sharing achievement ${achievementId} for user ${userId}`)
    return Promise.resolve()
  }
}

