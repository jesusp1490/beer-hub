import { Component, OnInit, OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { UserService } from "../services/user.service"
import { AuthService } from "../services/auth.service"
import { BeerService } from "../services/beer.service"
import { UserStatistics, UserProfile } from "../models/user.model"
import { Subject, of } from "rxjs"
import { takeUntil, take, switchMap } from "rxjs/operators"
import { ProfileSectionComponent } from "./components/profile-section/profile-section.component"
import { RankingSectionComponent } from "./components/ranking-section/ranking-section.component"
import { StatisticsComponent } from "./components/statistics/statistics.component"
import { LeaderboardComponent } from "./components/leaderboard/leaderboard.component"
import { ChallengesComponent } from "./components/challenges/challenges.component"
import { Timestamp } from "firebase/firestore"
import { NotificationPanelComponent } from "./components/notification-panel/notification-panel.component"
import { AchievementsSectionComponent } from "./components/achievements-section/achievements-section.component"
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
    RankingSectionComponent,
    StatisticsComponent,
    LeaderboardComponent,
    ChallengesComponent,
    NotificationPanelComponent,
    AchievementsSectionComponent,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null
  userStats: UserStatistics | null = null
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
        this.loadUserProfile()
        this.fixUserRank()
      } else {
        this.router.navigate(["/"])
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadUserProfile(): void {
    this.userService
      .getCurrentUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile
          this.userStats = profile?.statistics || null
          console.log("User profile loaded:", profile)
        },
        error: (error) => {
          console.error("Error loading user profile:", error)
          this.userProfile = null
          this.userStats = null
        },
      })
  }

  private fixUserRank(): void {
    this.userService
      .getCurrentUser()
      .pipe(
        take(1),
        switchMap((user) => {
          if (user?.uid) {
            return this.userService.recalculateUserPoints(user.uid)
          }
          return of(null)
        }),
      )
      .subscribe({
        next: () => {
          console.log("User rank recalculated")
          this.loadUserProfile()
        },
        error: (error) => {
          console.error("Error recalculating user rank:", error)
        },
      })
  }

  onEditField(event: { field: string; value: string | Date }): void {
    if (this.userProfile) {
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
            console.log(`Field ${event.field} updated successfully`)
            this.loadUserProfile()
          },
          error: (error) => {
            console.error(`Error updating ${event.field}:`, error)
          },
        })
    }
  }

  onChangePassword(): void {
    console.log("Changing password")
    // Implement password change logic here
  }

  onRequestNewBeer(): void {
    console.log("Requesting new beer")
    // Implement new beer request logic here
  }

  onLogout(): void {
    this.authService.signOut()
  }

  onUploadProfilePicture(file: File): void {
    this.userService
      .uploadProfilePicture(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (url) => {
          console.log("Profile picture uploaded:", url)
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
      )
      .subscribe({
        next: () => {
          console.log("Beer rating removed successfully")
          this.loadUserProfile() // Refresh user data
        },
        error: (error) => {
          console.error("Error removing beer rating:", error)
        },
      })
  }
}

