import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { Observable, of } from "rxjs"
import { map, switchMap, catchError } from "rxjs/operators"
import { AuthService } from "./auth.service"
import { Challenge } from "../models/challenge.model"

@Injectable({
  providedIn: "root",
})
export class ChallengeService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
  ) {}
  getActiveChallenges(): Observable<Challenge[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([])
        }
        return this.firestore
          .doc<{ challenges?: Challenge[] }>(`users/${user.uid}`)
          .valueChanges()
          .pipe(
            map((profile) => {
              const challenges = profile?.challenges || []
              // Only show non-expired challenges here; completed ones stay
              // visible until the hourly rotation replaces them, so users
              // get to see "Completed!" rather than having it vanish
              // instantly.
              const now = Date.now()
              return challenges.filter((c) => c.completed || c.endDate.toMillis() >= now)
            }),
            catchError((error) => {
              console.error("Error fetching challenges:", error)
              return of([])
            }),
          )
      }),
    )
  }
}
