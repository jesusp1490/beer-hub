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
                    statistics: this.initializeStatistics(profile.statistics),
                    rank: profile.rank || this.getDefaultRank(),
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
    )
  }

  private initializeStatistics(statistics: UserStatistics | undefined): UserStatistics {
    const defaultStats: UserStatistics = {
      totalBeersRated: 0,
      countriesExplored: [],
      beerTypeStats: {},
      mostActiveDay: { date: "", count: 0 },
      registrationDate: Timestamp.now(),
      points: 0,
      lastRatingDate: Timestamp.now(),
      uniqueStyles: 0,
      uniqueCountries: 0,
    }
    return statistics ? { ...defaultStats, ...statistics } : defaultStats
  }

  private getDefaultRank(): UserRank {
    return {
      level: 0,
      points: 0,
      progress: 0,
      name: "Novice",
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

          const updatedStats = this.calculateUpdatedStatistics(user.statistics || {}, newRating)

          return from(this.firestore.doc(`users/${userId}`).update({ statistics: updatedStats })).pipe(
            switchMap(() => this.updateUserRank(userId, updatedStats.points)),
            map(() => {}),
          )
        }),
      )
  }

  private calculateUpdatedStatistics(currentStats: UserStatistics, newRating: RatedBeer): UserStatistics {
    const updatedStats = { ...currentStats }
    updatedStats.totalBeersRated = (updatedStats.totalBeersRated || 0) + 1
    if (newRating.country) {
      updatedStats.countriesExplored = Array.from(
        new Set([...(updatedStats.countriesExplored || []), newRating.country]),
      )
    }
    if (newRating.beerType) {
      updatedStats.beerTypeStats = {
        ...(updatedStats.beerTypeStats || {}),
        [newRating.beerType]: ((updatedStats.beerTypeStats || {})[newRating.beerType] || 0) + 1,
      }
    }

    const today = new Date().toISOString().split("T")[0]
    if (today === updatedStats.mostActiveDay?.date) {
      updatedStats.mostActiveDay.count = (updatedStats.mostActiveDay.count || 0) + 1
    } else if (!updatedStats.mostActiveDay || (updatedStats.mostActiveDay.count || 0) < 1) {
      updatedStats.mostActiveDay = { date: today, count: 1 }
    }

    updatedStats.points = (updatedStats.points || 0) + 1
    updatedStats.lastRatingDate = Timestamp.now()
    updatedStats.uniqueStyles = Object.keys(updatedStats.beerTypeStats || {}).length
    updatedStats.uniqueCountries = updatedStats.countriesExplored?.length || 0

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
            })
          }

          if (stats.countriesExplored.length >= 3 && !currentAchievements.some((a) => a.id === "beer_explorer")) {
            newAchievements.push({
              id: "beer_explorer",
              name: "Beer Explorer",
              description: "Rate beers from 3 different countries",
              dateUnlocked: Timestamp.now(),
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
                this.notificationService.addNotification(
                  `Congratulations! You've reached level ${newRank.level}!`,
                  "rank",
                )
              }),
              map(() => newRank),
            )
          }

          return of(newRank)
        }),
      )
  }

  private calculateRank(points: number): UserRank {
    const levels = [
      { level: 0, name: "Novice", minPoints: 0, maxPoints: 9 },
      { level: 1, name: "Beer Recruit", minPoints: 10, maxPoints: 24 },
      { level: 2, name: "Hop Private", minPoints: 25, maxPoints: 49 },
      { level: 3, name: "Malt Corporal", minPoints: 50, maxPoints: 99 },
      { level: 4, name: "Ale Sergeant", minPoints: 100, maxPoints: 199 },
      { level: 5, name: "Lager Lieutenant", minPoints: 200, maxPoints: Number.POSITIVE_INFINITY },
    ]

    const currentLevel = levels.find((l) => points >= l.minPoints && points <= l.maxPoints) || levels[levels.length - 1]
    const progress = (points - currentLevel.minPoints) / (currentLevel.maxPoints - currentLevel.minPoints)

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      points: points,
      progress: Math.min(progress, 1),
    }
  }

  getLeaderboard(type: "global" | "country" = "global", limit = 10): Observable<LeaderboardEntry[]> {
    const query = this.firestore.collection<UserProfile>("users", (ref) =>
      ref.orderBy("statistics.points", "desc").limit(limit),
    )

    if (type === "country") {
      return this.authService.user$.pipe(
        switchMap((user) => {
          if (!user || !user.country) throw new Error("User not authenticated or country not set")
          return this.firestore
            .collection<UserProfile>("users", (ref) =>
              ref.where("country", "==", user.country).orderBy("statistics.points", "desc").limit(limit),
            )
            .valueChanges()
            .pipe(
              map((users) =>
                users.map((user) => ({
                  userId: user.uid,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                  rank: user.rank,
                  points: user.statistics.points,
                })),
              ),
            )
        }),
      )
    }

    return query.valueChanges().pipe(
      map((users) =>
        users.map((user) => ({
          userId: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          rank: user.rank,
          points: user.statistics.points,
        })),
      ),
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

