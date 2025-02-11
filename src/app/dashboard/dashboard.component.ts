import { Component, OnInit, OnDestroy } from "@angular/core"
import { UserService } from "../services/user.service"
import { AuthService } from "../services/auth.service"
import { NotificationService } from "../services/notification.service"
import { Router } from "@angular/router"
import { Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { UserProfile, Achievement, Challenge, LeaderboardEntry } from "../models/user.model"
import { Chart, ChartConfiguration } from "chart.js/auto"
import { Timestamp } from "firebase/firestore"

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null
  loading = true
  ratingChart: Chart | null = null
  styleChart: Chart | null = null
  countryChart: Chart | null = null
  recentAchievements: Achievement[] = []
  activeChallenges: Challenge[] = []
  completedChallenges: Challenge[] = []
  topUsers: LeaderboardEntry[] = []
  private unsubscribe$ = new Subject<void>()

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUserProfile()
    this.loadLeaderboard()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
    if (this.ratingChart) this.ratingChart.destroy()
    if (this.styleChart) this.styleChart.destroy()
    if (this.countryChart) this.countryChart.destroy()
  }

  private loadUserProfile(): void {
    this.loading = true
    this.authService.user$.pipe(takeUntil(this.unsubscribe$)).subscribe((user) => {
      if (user) {
        this.userService
          .getCurrentUserProfile()
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe({
            next: (profile) => {
              if (profile) {
                this.userProfile = profile
                this.loading = false
                this.processChallenges()
                this.loadRecentAchievements()
                this.createCharts()
              }
            },
            error: (error) => {
              console.error("Error loading user profile:", error)
              this.loading = false
              this.notificationService.showError("Error loading profile")
            },
          })
      } else {
        this.loading = false
        this.router.navigate(["/login"])
      }
    })
  }

  private loadLeaderboard(): void {
    this.userService
      .getLeaderboard()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (users) => {
          this.topUsers = users.slice(0, 5)
        },
        error: (error) => {
          console.error("Error loading leaderboard:", error)
          this.notificationService.showError("Error loading leaderboard")
        },
      })
  }

  private loadRecentAchievements(): void {
    if (this.userProfile?.achievements) {
      this.recentAchievements = this.userProfile.achievements
        .filter((a) => a.dateUnlocked)
        .sort((a, b) => (b.dateUnlocked as Timestamp).toMillis() - (a.dateUnlocked as Timestamp).toMillis())
        .slice(0, 3)
    }
  }

  private processChallenges(): void {
    if (this.userProfile?.challenges) {
      this.completedChallenges = this.userProfile.challenges.filter((challenge) => challenge.completed)
      this.activeChallenges = this.userProfile.challenges.filter((challenge) => !challenge.completed)
    }
  }

  private createCharts(): void {
    if (this.userProfile) {
      this.createRatingDistributionChart()
      this.createTopStylesChart()
      this.createTopCountriesChart()
    }
  }

  private createRatingDistributionChart(): void {
    const ctx = document.getElementById("ratingChart") as HTMLCanvasElement
    if (!ctx) return

    const ratings = this.userProfile?.statistics?.beerTypeStats || {}
    const data = Object.values(ratings)
    const labels = Object.keys(ratings)

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Beer Types Rated",
            data,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    }

    this.ratingChart = new Chart(ctx, config)
  }

  private createTopStylesChart(): void {
    const ctx = document.getElementById("styleChart") as HTMLCanvasElement
    if (!ctx) return

    const beerTypeStats = this.userProfile?.statistics?.beerTypeStats || {}
    const sortedStyles = Object.entries(beerTypeStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const config: ChartConfiguration = {
      type: "pie",
      data: {
        labels: sortedStyles.map(([style]) => style),
        datasets: [
          {
            data: sortedStyles.map(([, count]) => count),
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Top Beer Styles",
          },
        },
      },
    }

    this.styleChart = new Chart(ctx, config)
  }

  private createTopCountriesChart(): void {
    const ctx = document.getElementById("countryChart") as HTMLCanvasElement
    if (!ctx) return

    const countries = this.userProfile?.statistics?.countriesExplored || []
    const countryCount = countries.reduce(
      (acc, country) => {
        acc[country] = (acc[country] || 0) + 1
        return acc
      },
      {} as { [key: string]: number },
    )

    const sortedCountries = Object.entries(countryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const config: ChartConfiguration = {
      type: "doughnut",
      data: {
        labels: sortedCountries.map(([country]) => country),
        datasets: [
          {
            data: sortedCountries.map(([, count]) => count),
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Countries Explored",
          },
        },
      },
    }

    this.countryChart = new Chart(ctx, config)
  }

  shareAchievement(achievement: Achievement): void {
    // Implement social sharing functionality
    console.log("Sharing achievement:", achievement)
    this.notificationService.showSuccess("Achievement shared!")
  }

  viewDetailedProfile(): void {
    if (this.userProfile) {
      this.router.navigate(["/profile", this.userProfile.uid])
    }
  }
}

