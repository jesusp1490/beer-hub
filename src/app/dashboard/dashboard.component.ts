import { Component, OnInit, OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { UserService } from "../services/user.service"
import { AuthService } from "../services/auth.service"
import { ProfileSectionComponent } from "./components/profile-section/profile-section.component"
import { RankingSectionComponent } from "./components/ranking-section/ranking-section.component"
import { StatisticsComponent } from "./components/statistics/statistics.component"
import { AchievementSectionComponent } from "./components/achievements-section/achievements-section.component"
import { ChallengesComponent } from "./components/challenges/challenges.component"
import { LeaderboardComponent } from "./components/leaderboard/leaderboard.component"
import { Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { UserProfile, Achievement, Challenge, LeaderboardEntry } from "../models/user.model"

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ProfileSectionComponent,
    RankingSectionComponent,
    AchievementSectionComponent,
    ChallengesComponent,
    LeaderboardComponent,
    StatisticsComponent,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null
  achievements: Achievement[] = []
  challenges: Challenge[] = []
  globalLeaderboard: LeaderboardEntry[] = []
  countryLeaderboard: LeaderboardEntry[] = []
  loading = true
  error: string | null = null

  private unsubscribe$ = new Subject<void>()

  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private loadDashboardData(): void {
    this.authService.user$.pipe(takeUntil(this.unsubscribe$)).subscribe(
      (user) => {
        if (user) {
          this.userService
            .getCurrentUserProfile()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
              next: (profile) => {
                this.userProfile = profile
                this.loadAchievements()
                this.loadChallenges()
                this.loadLeaderboards()
                this.loading = false
              },
              error: (error) => {
                console.error("Error loading user profile:", error)
                this.error = "Failed to load user profile"
                this.loading = false
              },
            })
        } else {
          this.error = "User not authenticated"
          this.loading = false
        }
      },
      (error) => {
        console.error("Error in auth subscription:", error)
        this.error = "Authentication error"
        this.loading = false
      },
    )
  }

  private loadAchievements(): void {
    if (this.userProfile) {
      this.achievements = this.userProfile.achievements || []
    }
  }

  private loadChallenges(): void {
    if (this.userProfile) {
      this.challenges = this.userProfile.challenges || []
    }
  }

  private loadLeaderboards(): void {
    this.userService
      .getLeaderboard("global")
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (leaderboard) => {
          this.globalLeaderboard = leaderboard
        },
        error: (error) => {
          console.error("Error loading global leaderboard:", error)
        },
      })

    this.userService
      .getLeaderboard("country")
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (leaderboard) => {
          this.countryLeaderboard = leaderboard
        },
        error: (error) => {
          console.error("Error loading country leaderboard:", error)
        },
      })
  }
}

