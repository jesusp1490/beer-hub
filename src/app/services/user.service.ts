import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { AngularFireStorage } from "@angular/fire/compat/storage"
import { Observable, of, from, combineLatest, forkJoin } from "rxjs"
import { map, switchMap, catchError, take } from "rxjs/operators"
import { AuthService } from "./auth.service"
import { Beer } from "../components/beers/beers.interface"
import { UserProfile, FavoriteBeer, RatedBeer, Achievement, UserRank, UserStatistics } from "../models/user.model"
import { Timestamp } from "@angular/fire/firestore"

@Injectable({
  providedIn: "root",
})
export class UserService {
  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService,
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
    }
    return statistics ? { ...defaultStats, ...statistics } : defaultStats
  }

  private getDefaultRank(): UserRank {
    return {
      id: "novice",
      name: "Novice",
      icon: "🍺",
      minPoints: 0,
      maxPoints: 100,
      level: 1,
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
    // Add other point calculations as needed
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

          return from(this.firestore.doc(`users/${userId}`).update({ statistics: updatedStats }))
        }),
      )
  }

  private calculateUpdatedStatistics(currentStats: UserStatistics, newRating: RatedBeer): UserStatistics {
    const updatedStats = { ...currentStats }
    updatedStats.totalBeersRated = (updatedStats.totalBeersRated || 0) + 1
    updatedStats.countriesExplored = Array.from(new Set([...(updatedStats.countriesExplored || []), newRating.country]))
    updatedStats.beerTypeStats = {
      ...(updatedStats.beerTypeStats || {}),
      [newRating.beerType]: ((updatedStats.beerTypeStats || {})[newRating.beerType] || 0) + 1,
    }

    // Update most active day
    const today = new Date().toISOString().split("T")[0]
    if (today === updatedStats.mostActiveDay?.date) {
      updatedStats.mostActiveDay.count = (updatedStats.mostActiveDay.count || 0) + 1
    } else if (!updatedStats.mostActiveDay || (updatedStats.mostActiveDay.count || 0) < 1) {
      updatedStats.mostActiveDay = { date: today, count: 1 }
    }

    // Calculate points (1 point per rating)
    updatedStats.points = (updatedStats.points || 0) + 1

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

          // Check for achievements
          if (stats.totalBeersRated >= 1 && !currentAchievements.some((a) => a.id === "first_rater")) {
            newAchievements.push({
              id: "first_rater",
              name: "First Rater",
              description: "Rate your first beer",
              icon: "🏅",
              unlockedAt: Timestamp.now(),
              category: "beginner",
            })
          }

          if (stats.countriesExplored.length >= 3 && !currentAchievements.some((a) => a.id === "beer_explorer")) {
            newAchievements.push({
              id: "beer_explorer",
              name: "Beer Explorer",
              description: "Rate beers from 3 different countries",
              icon: "🌍",
              unlockedAt: Timestamp.now(),
              category: "beginner",
            })
          }

          // Add more achievement checks here...

          if (newAchievements.length > 0) {
            const updatedAchievements = [...currentAchievements, ...newAchievements]
            return from(this.firestore.doc(`users/${userId}`).update({ achievements: updatedAchievements })).pipe(
              map(() => updatedAchievements),
            )
          }

          return of(currentAchievements)
        }),
      )
  }

  updateUserRank(userId: string): Observable<UserRank> {
    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) throw new Error("User not found")

          const ranks: UserRank[] = [
            { id: "beer_recruit", name: "Beer Recruit", icon: "🏅", minPoints: 0, maxPoints: 20, level: 1 },
            { id: "hop_private", name: "Hop Private", icon: "🌿", minPoints: 21, maxPoints: 50, level: 2 },
            { id: "malt_corporal", name: "Malt Corporal", icon: "🌾", minPoints: 51, maxPoints: 100, level: 3 },
            { id: "ale_sergeant", name: "Ale Sergeant", icon: "🍺", minPoints: 101, maxPoints: 250, level: 4 },
            { id: "lager_lieutenant", name: "Lager Lieutenant", icon: "🍻", minPoints: 251, maxPoints: 500, level: 5 },
            { id: "stout_captain", name: "Stout Captain", icon: "🍺", minPoints: 501, maxPoints: 750, level: 6 },
            { id: "porter_colonel", name: "Porter Colonel", icon: "🛢️", minPoints: 751, maxPoints: 1000, level: 7 },
            {
              id: "imperial_general",
              name: "Imperial General",
              icon: "👑",
              minPoints: 1001,
              maxPoints: 2000,
              level: 8,
            },
            {
              id: "grand_brewmaster",
              name: "Grand Brewmaster",
              icon: "🏆",
              minPoints: 2001,
              maxPoints: Number.POSITIVE_INFINITY,
              level: 9,
            },
          ]

          const currentPoints = user.statistics?.points || 0
          const newRank = ranks.find((r) => currentPoints >= r.minPoints && currentPoints <= r.maxPoints) || ranks[0]

          if (!user.rank || newRank.id !== user.rank.id) {
            return from(this.firestore.doc(`users/${userId}`).update({ rank: newRank })).pipe(map(() => newRank))
          }

          return of(user.rank)
        }),
      )
  }

  removeFavoriteBeer(beerId: string): Observable<void> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (user) {
          return from(this.firestore.doc(`users/${user.uid}/favorites/${beerId}`).delete())
        } else {
          throw new Error("No authenticated user")
        }
      }),
    )
  }

  removeUserRating(beerId: string): Observable<void> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (user) {
          return from(this.firestore.doc(`users/${user.uid}/ratings/${beerId}`).delete())
        } else {
          throw new Error("No authenticated user")
        }
      }),
    )
  }

  getLeaderboard(type: "global" | "country", limit = 10): Observable<UserProfile[]> {
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
        }),
      )
    }

    return query.valueChanges()
  }
}

