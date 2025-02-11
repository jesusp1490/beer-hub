import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { AngularFireStorage } from "@angular/fire/compat/storage"
import { Observable, of, from, combineLatest, forkJoin } from "rxjs"
import { map, switchMap, catchError, take, tap } from "rxjs/operators"
import { AuthService } from "./auth.service"
import { Beer } from "../components/beers/beers.interface"
import { UserProfile, FavoriteBeer, RatedBeer, Achievement, UserRank, UserStatistics } from "../models/user.model"
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
    }
    return statistics ? { ...defaultStats, ...statistics } : defaultStats
  }

  private getDefaultRank(): UserRank {
    return {
      id: "novice",
      name: "Novice",
      icon: "🍺",
      minPoints: 0,
      maxPoints: 9,
      level: 0,
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
    updatedStats.countriesExplored = Array.from(new Set([...(updatedStats.countriesExplored || []), newRating.country]))
    updatedStats.beerTypeStats = {
      ...(updatedStats.beerTypeStats || {}),
      [newRating.beerType]: ((updatedStats.beerTypeStats || {})[newRating.beerType] || 0) + 1,
    }

    const today = new Date().toISOString().split("T")[0]
    if (today === updatedStats.mostActiveDay?.date) {
      updatedStats.mostActiveDay.count = (updatedStats.mostActiveDay.count || 0) + 1
    } else if (!updatedStats.mostActiveDay || (updatedStats.mostActiveDay.count || 0) < 1) {
      updatedStats.mostActiveDay = { date: today, count: 1 }
    }

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

          // Check for new achievements
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

          const internationalAdventurerLevels = [5, 10, 20]
          const highestInternationalLevel = internationalAdventurerLevels.filter(
            (level) => stats.countriesExplored.length >= level,
          ).length
          if (
            highestInternationalLevel > 0 &&
            !currentAchievements.some((a) => a.id === `international_adventurer_${highestInternationalLevel}`)
          ) {
            newAchievements.push({
              id: `international_adventurer_${highestInternationalLevel}`,
              name: "International Adventurer",
              description: `Rate beers from ${internationalAdventurerLevels[highestInternationalLevel - 1]}+ countries`,
              icon: "✈️",
              unlockedAt: Timestamp.now(),
              category: "intermediate",
            })
          }

          const stoutLoverLevels = [10, 25, 50]
          const highestStoutLevel = stoutLoverLevels.filter(
            (level) => (stats.beerTypeStats["Stout"] || 0) >= level,
          ).length
          if (highestStoutLevel > 0 && !currentAchievements.some((a) => a.id === `stout_lover_${highestStoutLevel}`)) {
            newAchievements.push({
              id: `stout_lover_${highestStoutLevel}`,
              name: "Stout Lover",
              description: `Rate ${stoutLoverLevels[highestStoutLevel - 1]} Stout beers`,
              icon: "🍫",
              unlockedAt: Timestamp.now(),
              category: "intermediate",
            })
          }

          if ((stats.beerTypeStats["IPA"] || 0) >= 30 && !currentAchievements.some((a) => a.id === "ipa_expert")) {
            newAchievements.push({
              id: "ipa_expert",
              name: "IPA Expert",
              description: "Rate 30 IPA beers",
              icon: "🌿",
              unlockedAt: Timestamp.now(),
              category: "intermediate",
            })
          }

          if (
            Object.keys(stats.beerTypeStats).length >= 5 &&
            !currentAchievements.some((a) => a.id === "malt_master")
          ) {
            newAchievements.push({
              id: "malt_master",
              name: "Malt Master",
              description: "Rate at least 5 different beer styles",
              icon: "🌾",
              unlockedAt: Timestamp.now(),
              category: "intermediate",
            })
          }

          if (stats.totalBeersRated >= 500 && !currentAchievements.some((a) => a.id === "beer_encyclopedia")) {
            newAchievements.push({
              id: "beer_encyclopedia",
              name: "Beer Encyclopedia",
              description: "Rate 500 beers",
              icon: "📚",
              unlockedAt: Timestamp.now(),
              category: "advanced",
            })
          }

          if (stats.countriesExplored.length >= 30 && !currentAchievements.some((a) => a.id === "global_beer_tour")) {
            newAchievements.push({
              id: "global_beer_tour",
              name: "Global Beer Tour",
              description: "Rate beers from 30 countries",
              icon: "🌎",
              unlockedAt: Timestamp.now(),
              category: "advanced",
            })
          }

          if (stats.totalBeersRated >= 1000 && !currentAchievements.some((a) => a.id === "grand_hops_master")) {
            newAchievements.push({
              id: "grand_hops_master",
              name: "Grand Hops Master",
              description: "Rate 1,000 beers",
              icon: "👑",
              unlockedAt: Timestamp.now(),
              category: "advanced",
            })
          }

          if (
            Object.keys(stats.beerTypeStats).length >= 20 &&
            !currentAchievements.some((a) => a.id === "flavor_collector")
          ) {
            newAchievements.push({
              id: "flavor_collector",
              name: "Flavor Collector",
              description: "Rate beers from 20 different styles",
              icon: "🍻",
              unlockedAt: Timestamp.now(),
              category: "advanced",
            })
          }

          const continents = ["North America", "South America", "Europe", "Asia", "Africa", "Australia", "Antarctica"]
          const ratedContinents = new Set(stats.countriesExplored.map((country) => this.getContinent(country)))
          if (
            ratedContinents.size === continents.length &&
            !currentAchievements.some((a) => a.id === "real_beer_hunter")
          ) {
            newAchievements.push({
              id: "real_beer_hunter",
              name: "The Real Beer Hunter",
              description: "Try a beer from every continent",
              icon: "🔥",
              unlockedAt: Timestamp.now(),
              category: "advanced",
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

  private getContinent(country: string): string {
    const continentMap: { [key: string]: string } = {
      "United States": "North America",
      Canada: "North America",
      Mexico: "North America",
      Brazil: "South America",
      Argentina: "South America",
      "United Kingdom": "Europe",
      Germany: "Europe",
      France: "Europe",
      China: "Asia",
      Japan: "Asia",
      India: "Asia",
      Egypt: "Africa",
      "South Africa": "Africa",
      Nigeria: "Africa",
      Australia: "Oceania",
      "New Zealand": "Oceania",
      Antarctica: "Antarctica",
    }

    return continentMap[country] || "Unknown"
  }

  updateUserRank(userId: string, currentPoints?: number): Observable<UserRank> {
    console.log(`Updating rank for user ${userId} with ${currentPoints} points`)

    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) throw new Error("User not found")

          const points = currentPoints !== undefined ? currentPoints : user.statistics?.points || 0
          console.log(`Current points: ${points}`)

          const ranks: UserRank[] = [
            { id: "novice", name: "Novice", icon: "🍺", minPoints: 0, maxPoints: 9, level: 0 },
            { id: "beer_recruit", name: "Beer Recruit", icon: "🏅", minPoints: 10, maxPoints: 20, level: 1 },
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

          const newRank = ranks.find((r) => points >= r.minPoints && points <= r.maxPoints) || ranks[0]
          console.log(`New rank: ${JSON.stringify(newRank)}`)

          if (!user.rank || newRank.name !== user.rank.name) {
            return from(this.firestore.doc(`users/${userId}`).update({ rank: newRank })).pipe(
              tap(() => {
                this.notificationService.addNotification(
                  `Congratulations! You've reached the rank of ${newRank.name}!`,
                  "rank",
                )
              }),
              map(() => {
                console.log(`Rank updated successfully to: ${newRank.name}`)
                return newRank
              }),
            )
          }

          return of(newRank)
        }),
        catchError((error) => {
          console.error(`Error updating rank: ${error}`)
          throw error
        }),
      )
  }

  manuallyUpdateRank(userId: string): Observable<UserRank> {
    return this.updateUserRank(userId, 0).pipe(
      tap((newRank) => {
        console.log(`Manually updated rank: ${JSON.stringify(newRank)}`)
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

  getLeaderboard(type: "global" | "country" = "global", limit = 10): Observable<UserProfile[]> {
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

  addPointsToUser(userId: string, points: number): Promise<void> {
    return this.firestore
      .doc(`users/${userId}`)
      .get()
      .pipe(
        take(1),
        switchMap((doc) => {
          const userData = doc.data() as UserProfile
          const newPoints = (userData.statistics?.points || 0) + points
          return this.firestore.doc(`users/${userId}`).update({
            "statistics.points": newPoints,
          })
        }),
        switchMap(() => this.updateUserRank(userId).pipe(map(() => {}))),
      )
      .toPromise()
  }
}

