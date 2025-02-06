import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { Observable, of, BehaviorSubject, from, forkJoin } from "rxjs"
import { map, switchMap, tap, take, catchError } from "rxjs/operators"
import { Beer } from "../components/beers/beers.interface"
import { Brand } from "../components/country/brand.interface"
import { Country } from "../components/country/country.interface"
import { AuthService } from "./auth.service"
import firebase from "firebase/compat/app"

interface RatingsData {
  count: number
  total: number
  average: number
}

@Injectable({
  providedIn: "root",
})
export class BeerService {
  private cachedBeers$ = new BehaviorSubject<Beer[]>([])
  private cachedBrands$ = new BehaviorSubject<Brand[]>([])
  private cachedCountries$ = new BehaviorSubject<Country[]>([])
  private cachedCountryBeerCounts$ = new BehaviorSubject<{ [countryId: string]: number }>({})
  private lastFetchTime = 0
  private cacheExpirationTime = 5 * 60 * 1000 // 5 minutes

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
  ) {
    this.initializeCache()
  }

  private initializeCache(): void {
    this.getBeers().pipe(take(1)).subscribe()
    this.getBrands().pipe(take(1)).subscribe()
    this.getCountries().pipe(take(1)).subscribe()
    this.getCountryBeerCounts().pipe(take(1)).subscribe()
  }

  private shouldRefetchCache(): boolean {
    return Date.now() - this.lastFetchTime > this.cacheExpirationTime
  }

  getCountries(): Observable<Country[]> {
    if (this.shouldRefetchCache()) {
      return this.firestore
        .collection<Country>("countries")
        .valueChanges({ idField: "id" })
        .pipe(
          take(1),
          tap((countries) => {
            this.cachedCountries$.next(countries)
            this.lastFetchTime = Date.now()
          }),
          catchError((error) => {
            console.error("Error fetching countries:", error)
            return of([])
          }),
        )
    }
    return this.cachedCountries$.asObservable()
  }

  getCountryBeerCounts(): Observable<{ [countryId: string]: number }> {
    return this.firestore
      .collection<Beer>("beers")
      .valueChanges()
      .pipe(
        map((beers) => {
          const countryCounts: { [countryId: string]: number } = {}
          beers.forEach((beer) => {
            if (beer.countryId) {
              countryCounts[beer.countryId] = (countryCounts[beer.countryId] || 0) + 1
            }
          })
          return countryCounts
        }),
        catchError((error) => {
          console.error("Error fetching country beer counts:", error)
          return of({})
        }),
      )
  }

  getBeers(): Observable<Beer[]> {
    if (this.shouldRefetchCache()) {
      return this.firestore
        .collection<Beer>("beers")
        .valueChanges({ idField: "id" })
        .pipe(
          take(1),
          tap((beers) => {
            this.cachedBeers$.next(beers)
            this.lastFetchTime = Date.now()
          }),
          catchError((error) => {
            console.error("Error fetching beers:", error)
            return of([])
          }),
        )
    }
    return this.cachedBeers$.asObservable()
  }

  getBrands(): Observable<Brand[]> {
    if (this.shouldRefetchCache()) {
      return this.firestore
        .collection<Brand>("brands")
        .valueChanges({ idField: "id" })
        .pipe(
          take(1),
          tap((brands) => {
            this.cachedBrands$.next(brands)
            this.lastFetchTime = Date.now()
          }),
          catchError((error) => {
            console.error("Error fetching brands:", error)
            return of([])
          }),
        )
    }
    return this.cachedBrands$.asObservable()
  }

  getBeerDetails(beerId: string): Observable<Beer | undefined> {
    console.log("BeerService: Fetching beer details for ID:", beerId)
    return this.firestore
      .doc<Beer>(`beers/${beerId}`)
      .valueChanges({ idField: "id" })
      .pipe(
        tap((beer) => console.log("BeerService: Received beer data from Firestore:", beer)),
        switchMap((beer) => {
          if (beer) {
            return this.calculateTotalRatings(beer).pipe(
              switchMap((totalRatings) =>
                this.calculateAverageRating(beer).pipe(
                  map((averageRating) => ({
                    ...beer,
                    ratingsCount: totalRatings,
                    averageRating: averageRating,
                  })),
                ),
              ),
            )
          }
          return of(undefined)
        }),
        catchError((error) => {
          console.error("BeerService: Error fetching beer details:", error)
          return of(undefined)
        }),
      )
  }

  private calculateAverageRating(beer: Beer): Observable<number> {
    return this.firestore
      .collection(`beers/${beer.id}/ratings`)
      .get()
      .pipe(
        map((snapshot) => {
          let totalScore = 0
          let totalRatings = 0

          // Get ratings from the old format
          if (beer.rating) {
            Object.values(beer.rating).forEach((rating) => {
              if (typeof rating === "number") {
                totalScore += rating
                totalRatings++
              }
            })
          }

          // Get ratings from the new format (subcollection)
          snapshot.docs.forEach((doc) => {
            const rating = (doc.data() as { rating: number }).rating
            if (typeof rating === "number") {
              totalScore += rating
              totalRatings++
            }
          })

          // Calculate final average
          return totalRatings > 0 ? totalScore / totalRatings : 0
        }),
        catchError((error) => {
          console.error("Error calculating average rating:", error)
          return of(0)
        }),
      )
  }

  private calculateTotalRatings(beer: Beer): Observable<number> {
    return this.firestore
      .collection(`beers/${beer.id}/ratings`)
      .get()
      .pipe(
        map((snapshot) => {
          // Get all user IDs who rated in the new system
          const newRatingUserIds = new Set(snapshot.docs.map((doc) => doc.id))

          // Get all user IDs who rated in the old system
          const oldRatingUserIds = new Set(
            Object.entries(beer.rating || {})
              .filter(([_, rating]) => typeof rating === "number")
              .map(([userId]) => userId),
          )

          // Combine unique user IDs to get total unique ratings
          const uniqueUserIds = new Set([...newRatingUserIds, ...oldRatingUserIds])

          return uniqueUserIds.size
        }),
        catchError((error) => {
          console.error("Error calculating total ratings:", error)
          return of(0)
        }),
      )
  }

  rateBeer(beerId: string, rating: number): Observable<void> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) throw new Error("User not authenticated")
        const userId = user.uid
        const beerRef = this.firestore.doc(`beers/${beerId}`).ref
        const userRatingRef = this.firestore.doc(`beers/${beerId}/ratings/${userId}`).ref
        const userRatingDocRef = this.firestore.doc(`users/${userId}/ratings/${beerId}`).ref

        return from(
          this.firestore.firestore.runTransaction(async (transaction) => {
            const beerDoc = await transaction.get(beerRef)
            if (!beerDoc.exists) {
              throw new Error("Beer does not exist!")
            }

            const beerData = beerDoc.data() as Beer
            const oldRatings = beerData.rating || {}

            // Remove the old rating for this user if it exists
            if (oldRatings[userId]) {
              const updatedRating = { ...oldRatings }
              delete updatedRating[userId]
              transaction.update(beerRef, { rating: updatedRating })
            }

            // Add the new rating in the beer's subcollection
            transaction.set(userRatingRef, {
              rating,
              ratedAt: firebase.firestore.FieldValue.serverTimestamp(),
            })

            // Add the new rating in the user's ratings subcollection
            transaction.set(userRatingDocRef, {
              beerId,
              rating,
              ratedAt: firebase.firestore.FieldValue.serverTimestamp(),
            })

            // Recalculate total ratings and average
            const ratingsSnapshot = await this.firestore.collection(`beers/${beerId}/ratings`).get().toPromise()

            const newRatingUserIds = new Set(ratingsSnapshot?.docs.map((doc) => doc.id) ?? [])
            const oldRatingUserIds = new Set(
              Object.entries(oldRatings)
                .filter(([_, r]) => typeof r === "number")
                .map(([uid]) => uid),
            )

            const uniqueUserIds = new Set([...newRatingUserIds, ...oldRatingUserIds])
            const ratingsCount = uniqueUserIds.size

            // Calculate total score from both old and new ratings
            let totalScore = 0

            // Add scores from old ratings
            Object.entries(oldRatings).forEach(([uid, r]) => {
              if (typeof r === "number" && !newRatingUserIds.has(uid)) {
                totalScore += r
              }
            })

            // Add scores from new ratings
            ratingsSnapshot?.docs.forEach((doc) => {
              const r = (doc.data() as { rating: number }).rating
              if (typeof r === "number") {
                totalScore += r
              }
            })

            const averageRating = ratingsCount > 0 ? totalScore / ratingsCount : 0

            transaction.update(beerRef, {
              averageRating,
              ratingsCount,
            })

            return { averageRating, ratingsCount }
          }),
        )
      }),
      tap((result) => {
        // Update the cached beer data
        const cachedBeers = this.cachedBeers$.value
        const updatedBeerIndex = cachedBeers.findIndex((beer) => beer.id === beerId)
        if (updatedBeerIndex !== -1) {
          cachedBeers[updatedBeerIndex] = {
            ...cachedBeers[updatedBeerIndex],
            averageRating: result.averageRating,
            ratingsCount: result.ratingsCount,
          }
          this.cachedBeers$.next(cachedBeers)
        }
      }),
      map(() => undefined),
      catchError((error) => {
        console.error("Error rating beer:", error)
        throw error
      }),
    )
  }

  getUserRating(beerId: string): Observable<number | null> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) {
          return of(null)
        }
        return this.firestore
          .doc(`users/${user.uid}/ratings/${beerId}`)
          .valueChanges()
          .pipe(
            map((data: any) => data?.rating || null),
            catchError((error) => {
              console.error("Error fetching user rating:", error)
              return of(null)
            }),
          )
      }),
    )
  }

  deleteUserRating(beerId: string): Observable<void> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) throw new Error("User not authenticated")
        const userId = user.uid
        const beerRef = this.firestore.doc(`beers/${beerId}`).ref
        const userRatingRef = this.firestore.doc(`beers/${beerId}/ratings/${userId}`).ref
        const userRatingDocRef = this.firestore.doc(`users/${userId}/ratings/${beerId}`).ref

        return from(
          this.firestore.firestore.runTransaction(async (transaction) => {
            const beerDoc = await transaction.get(beerRef)
            const userRatingDoc = await transaction.get(userRatingRef)

            if (!beerDoc.exists) {
              throw new Error("Beer does not exist!")
            }

            if (!userRatingDoc.exists) {
              throw new Error("User rating does not exist!")
            }

            const beerData = beerDoc.data() as Beer
            const userRatingData = userRatingDoc.data() as { rating?: number }
            const oldRating = userRatingData?.rating || 0
            const oldRatingsCount = beerData.ratingsCount || 0
            const oldTotalScore = (beerData.averageRating || 0) * oldRatingsCount

            const newRatingsCount = oldRatingsCount - 1
            const newTotalScore = oldTotalScore - oldRating
            const newAverageRating = newRatingsCount > 0 ? newTotalScore / newRatingsCount : 0

            transaction.delete(userRatingRef)
            transaction.delete(userRatingDocRef)
            transaction.update(beerRef, {
              averageRating: newAverageRating,
              ratingsCount: newRatingsCount,
            })

            // Remove the rating from the old rating format as well
            if (beerData.rating && beerData.rating[userId]) {
              const updatedRating = { ...beerData.rating }
              delete updatedRating[userId]
              transaction.update(beerRef, { rating: updatedRating })
            }

            return { averageRating: newAverageRating, ratingsCount: newRatingsCount }
          }),
        )
      }),
      tap((result) => {
        // Update the cached beer data
        const cachedBeers = this.cachedBeers$.value
        const updatedBeerIndex = cachedBeers.findIndex((beer) => beer.id === beerId)
        if (updatedBeerIndex !== -1) {
          cachedBeers[updatedBeerIndex] = {
            ...cachedBeers[updatedBeerIndex],
            averageRating: result.averageRating,
            ratingsCount: result.ratingsCount,
          }
          this.cachedBeers$.next(cachedBeers)
        }
      }),
      map(() => undefined),
      catchError((error) => {
        console.error("Error deleting user rating:", error)
        throw error
      }),
    )
  }

  isUserFavorite(beerId: string): Observable<boolean> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) return of(false)
        return this.firestore
          .doc(`users/${user.uid}/favorites/${beerId}`)
          .get()
          .pipe(
            map((doc) => doc.exists),
            take(1),
          )
      }),
      catchError((error) => {
        console.error("Error checking if beer is favorite:", error)
        return of(false)
      }),
    )
  }

  toggleFavorite(beerId: string): Observable<boolean> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) throw new Error("User not authenticated")
        const favoriteRef = this.firestore.doc(`users/${user.uid}/favorites/${beerId}`)
        return favoriteRef.get().pipe(
          take(1),
          switchMap((doc) => {
            if (doc.exists) {
              return favoriteRef.delete().then(() => false)
            } else {
              return favoriteRef.set({}).then(() => true)
            }
          }),
        )
      }),
    )
  }

  getBrandDetails(brandId: string): Observable<Brand | undefined> {
    return this.firestore
      .doc<Brand>(`brands/${brandId}`)
      .valueChanges({ idField: "id" })
      .pipe(
        take(1),
        catchError((error) => {
          console.error("Error fetching brand details:", error)
          return of(undefined)
        }),
      )
  }

  getCountryDetails(countryId: string): Observable<Country | undefined> {
    return this.firestore
      .doc<Country>(`countries/${countryId}`)
      .valueChanges({ idField: "id" })
      .pipe(
        take(1),
        catchError((error) => {
          console.error("Error fetching country details:", error)
          return of(undefined)
        }),
      )
  }

  initializeRatingsCount(): Observable<void> {
    return this.getBeers().pipe(
      switchMap((beers) => {
        const updates = beers.map((beer) => {
          return this.calculateTotalRatings(beer).pipe(
            switchMap((totalRatings) =>
              this.calculateAverageRating(beer).pipe(
                switchMap((averageRating) =>
                  from(
                    this.firestore.doc(`beers/${beer.id}`).update({
                      ratingsCount: totalRatings,
                      averageRating: averageRating,
                    }),
                  ),
                ),
              ),
            ),
          )
        })
        return forkJoin(updates)
      }),
      map(() => undefined),
    )
  }

  getRatingsCount(beerId: string): Observable<number> {
    return this.firestore
      .doc(`beers/${beerId}`)
      .valueChanges()
      .pipe(
        map((data: any) => {
          return data?.ratingsCount || 0
        }),
        catchError((error) => {
          console.error("Error fetching ratings count:", error)
          return of(0)
        }),
      )
  }

  getRandomBestRatedBeers(limit = 8): Observable<Beer[]> {
    return this.getBeers().pipe(
      map((beers) => {
        const bestRated = beers
          .filter((beer) => beer.averageRating !== undefined && beer.averageRating >= 4.0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        return this.getRandomSubset(bestRated, limit)
      }),
    )
  }

  getRandomPopularBrands(limit = 8): Observable<Brand[]> {
    return this.getBrands().pipe(
      map((brands) => {
        const sortedBrands = brands.sort((a, b) => b.beersCount - a.beersCount)
        const topBrands = sortedBrands.slice(0, Math.min(50, sortedBrands.length))
        return this.getRandomSubset(topBrands, limit)
      }),
    )
  }

  private getRandomSubset<T>(array: T[], n: number): T[] {
    const shuffled = array.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, n)
  }

  getUserFavoriteBeers(): Observable<Beer[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([])
        }
        return this.firestore
          .collection(`users/${user.uid}/favorites`)
          .valueChanges({ idField: "id" })
          .pipe(
            take(1),
            switchMap((favorites: any[]) => {
              if (favorites.length === 0) {
                return of([])
              }
              const beerIds = favorites.map((f) => f.id)
              return this.getBeers().pipe(map((beers) => beers.filter((beer) => beerIds.includes(beer.id)).slice(0, 5)))
            }),
          )
      }),
    )
  }

  getLatestBeers(): Observable<Beer[]> {
    return this.getBeers().pipe(
      map((beers) =>
        beers
          .filter((beer) => beer.addedDate !== undefined)
          .sort((a, b) => {
            const dateA = a.addedDate ? new Date(a.addedDate).getTime() : 0
            const dateB = b.addedDate ? new Date(b.addedDate).getTime() : 0
            return dateB - dateA
          })
          .slice(0, 5),
      ),
    )
  }

  getFilteredBeers(filters: any): Observable<Beer[]> {
    return this.getBeers().pipe(
      map((beers) =>
        beers.filter((beer) => {
          const matchesSearchTerm = filters.searchTerm
            ? beer.name?.toLowerCase().includes(filters.searchTerm.toLowerCase())
            : true

          const matchesBrand = filters.brand ? beer.brandId?.toLowerCase().includes(filters.brand.toLowerCase()) : true

          const matchesBeerType =
            filters.beerTypes && filters.beerTypes.length > 0 ? filters.beerTypes.includes(beer.beerType) : true

          const matchesIngredient = filters.ingredient
            ? beer.ingredients?.some((ing) => ing.name?.toLowerCase().includes(filters.ingredient.toLowerCase()))
            : true

          const matchesAbv = beer.ABV !== undefined ? beer.ABV >= filters.abvMin && beer.ABV <= filters.abvMax : true

          return matchesSearchTerm && matchesBrand && matchesBeerType && matchesIngredient && matchesAbv
        }),
      ),
    )
  }

  getBeersByBrand(brandId: string): Observable<Beer[]> {
    return this.getBeers().pipe(
      map((beers) => beers.filter((beer) => beer.brandId === brandId)),
      switchMap((beers) => {
        const beerObservables = beers.map((beer) =>
          this.calculateTotalRatings(beer).pipe(
            switchMap((totalRatings) =>
              this.calculateAverageRating(beer).pipe(
                map((averageRating) => ({
                  ...beer,
                  ratingsCount: totalRatings,
                  averageRating: averageRating,
                })),
              ),
            ),
          ),
        )
        return forkJoin(beerObservables)
      }),
    )
  }

  getPopularFavoriteBeers(): Observable<Beer[]> {
    return this.firestore
      .collectionGroup("favorites")
      .valueChanges()
      .pipe(
        take(1),
        map((favorites) => {
          const beerCounts: { [key: string]: number } = {}
          favorites.forEach((fav: any) => {
            beerCounts[fav.beerId] = (beerCounts[fav.beerId] || 0) + 1
          })
          return Object.entries(beerCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([beerId]) => beerId)
        }),
        switchMap((popularBeerIds) =>
          this.getBeers().pipe(map((beers) => beers.filter((beer) => popularBeerIds.includes(beer.id)))),
        ),
      )
  }

  validateBeer(beer: Partial<Beer>): beer is Required<Beer> {
    return (
      typeof beer.name === "string" &&
      typeof beer.brand === "string" &&
      typeof beer.beerType === "string" &&
      Array.isArray(beer.ingredients) &&
      beer.ingredients.every((ing) => typeof ing.name === "string") &&
      typeof beer.ABV === "number"
    )
  }

  addBeer(beer: Partial<Beer>): Observable<string> {
    if (this.validateBeer(beer)) {
      return from(this.firestore.collection("beers").add(beer)).pipe(
        tap(() => this.refreshCache()),
        map((docRef) => docRef.id),
      )
    } else {
      return of(Promise.reject(new Error("Invalid beer data"))) as Observable<never>
    }
  }

  refreshCache(): void {
    this.lastFetchTime = 0
    this.initializeCache()
  }

  submitNewBeerRequest(newBeer: any): Observable<void> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) {
          throw new Error("No authenticated user")
        }
        return from(
          this.firestore.collection("beerRequests").add({
            ...newBeer,
            userId: user.uid,
            userEmail: user.email,
            createdAt: new Date(),
          }),
        )
      }),
      map(() => undefined),
      catchError((error) => {
        console.error("Error submitting new beer request:", error)
        throw error
      }),
    )
  }
}

