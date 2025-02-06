import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { AngularFireStorage } from "@angular/fire/compat/storage"
import { Observable, of, from, combineLatest, forkJoin } from "rxjs"
import { map, switchMap, catchError, take } from "rxjs/operators"
import { AuthService } from "./auth.service"
import { Beer } from "../components/beers/beers.interface"
import { UserProfile, FavoriteBeer, RatedBeer } from "../models/user.model"
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

  getCurrentUserProfile(): Observable<UserProfile | null> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .doc<UserProfile>(`users/${user.uid}`)
            .valueChanges()
            .pipe(map((profile) => profile || null))
        } else {
          return of(null)
        }
      }),
      catchError((error) => {
        console.error("Error fetching user profile:", error)
        return of(null)
      }),
    )
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
          // Fetch new ratings from the user's ratings subcollection
          this.firestore
            .collection<{ rating: number; ratedAt: Timestamp }>(`users/${user.uid}/ratings`)
            .valueChanges({ idField: "beerId" }),
          // Fetch all beers to check for old rating format
          this.firestore
            .collection<Beer>("beers")
            .valueChanges({ idField: "id" }),
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
}

