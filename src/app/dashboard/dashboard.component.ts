import { Component, OnInit, OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { UserService } from "../services/user.service"
import { AuthService } from "../services/auth.service"
import { BeerService } from "../services/beer.service"
import { UserStatistics, UserProfile, RatedBeer, FavoriteBeer, LeaderboardEntry } from "../models/user.model"
import { Subject, of } from "rxjs"
import { takeUntil, take, switchMap } from "rxjs/operators"
import { ProfileSectionComponent } from "./components/profile-section/profile-section.component"
import { StatisticsComponent } from "./components/statistics/statistics.component"
import { LeaderboardComponent } from "./components/leaderboard/leaderboard.component"
import { ChallengesComponent } from "./components/challenges/challenges.component"
import { Timestamp } from "firebase/firestore"
import { NotificationPanelComponent } from "./components/notification-panel/notification-panel.component"
import { AchievementsSectionComponent } from "./components/achievements-section/achievements-section.component"
// NEW: the missing rated/favorite beers view discussed earlier.
import { RatedFavoriteBeersComponent } from "./components/rated-favorite-beers/rated-favorite-beers.component"
import { Router } from "@angular/router"

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ProfileSectionComponent,
    StatisticsComponent,
    LeaderboardComponent,
    ChallengesComponent,
    NotificationPanelComponent,
    AchievementsSectionComponent,
    // NEW
    RatedFavoriteBeersComponent,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null
  userStats: UserStatistics | null = null

  // NEW: backing data for the rated/favorite beers section.
  ratedBeers: RatedBeer[] | null = null
  favoriteBeers: FavoriteBeer[] | null = null
  beersLoading = false

  // NEW: backing data for the leaderboard, previously never fetched at all
  // — <app-leaderboard> was rendered with no inputs bound.
  globalLeaderboard: LeaderboardEntry[] = []
  countryLeaderboard: LeaderboardEntry[] = []

  private destroy$ = new Subject<void>()

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private beerService: BeerService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        // NOTE: fixUserRank()/recalculateUserPoints() is intentionally NOT
        // called here on every load — see the earlier fix. Points/rank are
        // now maintained correctly at the source via transactions.
        this.loadUserProfile()
        this.loadRatedAndFavoriteBeers()
        this.loadLeaderboards()
      } else {
        this.router.navigate(["/"])
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  // NEW: fetches both leaderboards. Country leaderboard waits for the
  // user's profile to load first, since it needs userProfile.country —
  // that's why this re-runs from loadUserProfile's subscription too, not
  // just once on init.
  private loadLeaderboards(): void {
    this.userService
      .getLeaderboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (entries) => {
          this.globalLeaderboard = entries
        },
        error: (error) => {
          console.error("Error loading global leaderboard:", error)
          this.globalLeaderboard = []
        },
      })
  }

  private loadCountryLeaderboard(country: string | null): void {
    if (!country) {
      this.countryLeaderboard = []
      return
    }
    this.userService
      .getCountryLeaderboard(country)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (entries) => {
          this.countryLeaderboard = entries
        },
        error: (error) => {
          console.error("Error loading country leaderboard:", error)
          this.countryLeaderboard = []
        },
      })
  }

  private loadUserProfile(): void {
    this.userService
      .getCurrentUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile
          this.userStats = profile?.statistics || null
          this.loadCountryLeaderboard(profile?.country || null)
        },
        error: (error) => {
          console.error("Error loading user profile:", error)
          this.userProfile = null
          this.userStats = null
        },
      })
  }

  // NEW: loads both lists using the already-batched UserService methods
  // (getUserRatedBeers / getUserFavoriteBeers — see user.service.ts fixes).
  private loadRatedAndFavoriteBeers(): void {
    this.beersLoading = true

    this.userService
      .getUserRatedBeers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ratedBeers) => {
          this.ratedBeers = ratedBeers
          this.beersLoading = false
        },
        error: (error) => {
          console.error("Error loading rated beers:", error)
          this.ratedBeers = []
          this.beersLoading = false
        },
      })

    this.userService
      .getUserFavoriteBeers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (favoriteBeers) => {
          this.favoriteBeers = favoriteBeers
        },
        error: (error) => {
          console.error("Error loading favorite beers:", error)
          this.favoriteBeers = []
        },
      })
  }

  onEditField(event: { field: string; value: string | Date }): void {
    if (!this.userProfile) return

    if (event.field === "email") {
      this.authService
        .updateEmail(event.value as string)
        .then(() => this.loadUserProfile())
        .catch((error) => {
          console.error("Error updating email:", error)
          // TODO: surface this to the user — updateEmail can fail if Firebase
          // requires recent re-authentication before an email change. This
          // currently fails silently from the UI's perspective.
        })
      return
    }

    const updatedProfile: Partial<UserProfile> = { ...this.userProfile }

    if (event.field === "dob") {
      updatedProfile.dob = Timestamp.fromDate(event.value as Date)
    } else if (event.field === "firstName" || event.field === "lastName") {
      updatedProfile[event.field] = event.value as string
    } else {
      ;(updatedProfile as any)[event.field] = event.value
    }

    this.userService
      .updateUserProfile(updatedProfile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUserProfile()
        },
        error: (error) => {
          console.error(`Error updating ${event.field}:`, error)
        },
      })
  }

  onChangePassword(): void {
    // Handled via the change-password dialog opened in ProfileSectionComponent.
  }

  onRequestNewBeer(): void {
    // Handled via the new-beer-request dialog opened in ProfileSectionComponent.
  }

  onLogout(): void {
    this.authService.signOut()
  }

  onUploadProfilePicture(file: File): void {
    this.userService
      .uploadProfilePicture(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUserProfile()
        },
        error: (error) => {
          console.error("Error uploading profile picture:", error)
        },
      })
  }

  removeBeerRating(beerId: string): void {
    this.userService
      .getCurrentUser()
      .pipe(
        take(1),
        switchMap((user) => {
          if (user) {
            return this.userService.removeBeerRating(user.uid, beerId)
          }
          throw new Error("User not found")
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.loadUserProfile()
          this.loadRatedAndFavoriteBeers()
        },
        error: (error) => {
          console.error("Error removing beer rating:", error)
        },
      })
  }

  // NEW: handler for the "remove favorite" action emitted by
  // RatedFavoriteBeersComponent. Reuses BeerService.toggleFavorite, which
  // already handles add/remove (calling it on an existing favorite removes it).
  removeFavoriteBeer(beerId: string): void {
    this.beerService
      .toggleFavorite(beerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadRatedAndFavoriteBeers()
        },
        error: (error) => {
          console.error("Error removing favorite:", error)
        },
      })
  }
}
