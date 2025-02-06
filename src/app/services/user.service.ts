import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { AngularFireStorage } from "@angular/fire/compat/storage"
import { Observable, of, from, combineLatest, forkJoin } from "rxjs"
import { map, switchMap, catchError, take } from "rxjs/operators"
import { AuthService } from "./auth.service"
import { Beer } from "../components/beers/beers.interface"
import { UserProfile, FavoriteBeer, RatedBeer, Achievement, UserRank } from "../models/user.model"
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
                    statistics: profile.statistics || {
                      totalBeersRated: 0,
                      countriesExplored: [],
                      beerTypeStats: {},
                      mostActiveDay: { date: "", count: 0 },
                      registrationDate: Timestamp.now(),
                      points: 0,
                    },
                    rank: profile.rank || {
                      id: "",
                      name: "Novice",
                      icon: "🍺",
                      minPoints: 0,
                      maxPoints: 100,
                      level: 1,
                    },
                  }
                }
                // Return null if profile is not found, instead of throwing an error
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
        return combineLatest([
          this.firestore
            .collection<{ rating: number; ratedAt: Timestamp }>(`users/${user.uid}/ratings`)
            .valueChanges({ idField: "beerId" }),
          this.firestore.collection<Beer>("beers").valueChanges({ idField: "id" }),
        ]).pipe(
          map(([newRatings, allBeers]) => {
            const oldRatings = allBeers
              .filter((beer) => beer.rating && typeof beer.rating === "object" && user.uid in beer.rating)
              .map((beer) => ({
                beerId: beer.id,
                rating: beer.rating && beer.rating[user.uid] ? (beer.rating[user.uid] as number) : 0,
                ratedAt: null as Timestamp | null,
              }))

            const combinedRatings = [...newRatings, ...oldRatings]

            return forkJoin(
              combinedRatings.map((rating) =>
                this.firestore
                  .doc<Beer>(`beers/${rating.beerId}`)
                  .valueChanges()
                  .pipe(
                    take(1),
                    map(
                      (beer) =>
                        ({
                          id: rating.beerId,
                          name: beer?.name || "Unknown Beer",
                          beerLabelUrl: beer?.beerLabelUrl || "",
                          beerImageUrl: beer?.beerImageUrl || "",
                          rating: rating.rating,
                          ratedAt: rating.ratedAt,
                          country: beer?.countryId || "",
                          beerType: beer?.beerType || "",
                        }) as RatedBeer,
                    ),
                  ),
              ),
            )
          }),
          switchMap((observable) => observable),
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

          const currentStats = user.statistics || {
            totalBeersRated: 0,
            countriesExplored: [],
            beerTypeStats: {},
            mostActiveDay: { date: "", count: 0 },
            registrationDate: Timestamp.now(),
            points: 0,
          }

          const updatedStats = {
            ...currentStats,
            totalBeersRated: (currentStats.totalBeersRated || 0) + 1,
            countriesExplored: [...new Set([...(currentStats.countriesExplored || []), newRating.country])],
            beerTypeStats: {
              ...(currentStats.beerTypeStats || {}),
              [newRating.beerType]: ((currentStats.beerTypeStats || {})[newRating.beerType] || 0) + 1,
            },
            points: this.calculatePoints({ ...user, statistics: currentStats }),
          }

          // Update most active day if necessary
          const today = new Date().toISOString().split("T")[0]
          if (today === updatedStats.mostActiveDay.date) {
            updatedStats.mostActiveDay.count++
          } else if (updatedStats.mostActiveDay.count < 1) {
            updatedStats.mostActiveDay = { date: today, count: 1 }
          }

          return from(this.firestore.doc(`users/${userId}`).update({ statistics: updatedStats }))
        }),
      )
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
          const currentStats = user.statistics || { totalBeersRated: 0, countriesExplored: [] }

          // Check for achievements
          if (currentStats.totalBeersRated >= 1 && !currentAchievements.some((a) => a.id === "first_rater")) {
            newAchievements.push({
              id: "first_rater",
              name: "First Rater",
              description: "Rate your first beer",
              icon: "🏅",
              unlockedAt: Timestamp.now(),
              category: "beginner",
            })
          }

          if (
            currentStats.countriesExplored.length >= 3 &&
            !currentAchievements.some((a) => a.id === "beer_explorer")
          ) {
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
              map(() => newAchievements),
            )
          }

          return of([])
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
          const currentRank = user.rank || ranks[0]

          const newRank = ranks.find((r) => currentPoints >= r.minPoints && currentPoints <= r.maxPoints) || currentRank

          if (newRank.id !== currentRank.id) {
            return from(this.firestore.doc(`users/${userId}`).update({ rank: newRank })).pipe(map(() => newRank))
          }

          return of(currentRank)
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

