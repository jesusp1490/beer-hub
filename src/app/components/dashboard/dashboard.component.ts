import { Component, OnInit, OnDestroy } from "@angular/core"
import { Observable, Subject, combineLatest } from "rxjs"
import { takeUntil, switchMap } from "rxjs/operators"
import { Router } from "@angular/router"
import { MatDialog } from "@angular/material/dialog"
import { Chart } from "chart.js/auto"
import { FormControl } from "@angular/forms"
import { MatTableDataSource } from "@angular/material/table"
import { AuthService } from "../../services/auth.service"
import { UserService } from "../../services/user.service"
import { BeerService } from "../../services/beer.service"
import { NotificationService } from "../../services/notification.service"
import { UserProfile, FavoriteBeer, RatedBeer, Achievement, UserRank, Notification } from "../../models/user.model"
import { NewBeerRequestComponent } from "../profile/new-beer-request.component"

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  userProfile$: Observable<UserProfile | null>
  favoriteBeers$: Observable<FavoriteBeer[]>
  ratedBeers$: Observable<RatedBeer[]>
  achievements$: Observable<Achievement[]>
  userRank$: Observable<UserRank | null>
  notifications$: Observable<Notification[]>

  ratedBeersDataSource: MatTableDataSource<RatedBeer> = new MatTableDataSource<RatedBeer>()
  displayedColumns: string[] = ["beer", "rating", "date", "actions"]

  bioControl = new FormControl("")
  isEditingBio = false

  ratingDistributionChart: Chart | null = null
  beerStylesChart: Chart | null = null
  ratingTrendChart: Chart | null = null
  achievementsChart: Chart | null = null

  totalBeers = 0
  averageRating = 0
  totalCountries = 0
  completionPercentage = 0

  private unsubscribe$ = new Subject<void>()

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private beerService: BeerService,
    private notificationService: NotificationService,
    private router: Router,
    private dialog: MatDialog,
  ) {
    this.userProfile$ = this.userService.getCurrentUserProfile()
    this.favoriteBeers$ = this.userService.getUserFavoriteBeers()
    this.ratedBeers$ = this.userService.getUserRatedBeers()
    this.achievements$ = this.authService.user$.pipe(
      switchMap((user) => this.userService.checkAndUpdateAchievements(user?.uid || "")),
    )
    this.userRank$ = this.authService.user$.pipe(switchMap((user) => this.userService.updateUserRank(user?.uid || "")))
    this.notifications$ = this.notificationService.getNotifications()

    this.userProfile$.pipe(takeUntil(this.unsubscribe$)).subscribe((profile) => {
      if (profile) {
        this.bioControl.setValue(profile.bio || "")
      }
    })

    this.initializeStatistics()
  }

  ngOnInit(): void {
    console.log("Dashboard component initialized")
    this.loadUserData()
    this.initializeCharts()

    this.ratedBeers$.pipe(takeUntil(this.unsubscribe$)).subscribe((beers) => {
      this.ratedBeersDataSource.data = beers || []
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()

    if (this.ratingDistributionChart) this.ratingDistributionChart.destroy()
    if (this.beerStylesChart) this.beerStylesChart.destroy()
    if (this.ratingTrendChart) this.ratingTrendChart.destroy()
    if (this.achievementsChart) this.achievementsChart.destroy()
  }

  private initializeStatistics(): void {
    combineLatest([this.userProfile$, this.ratedBeers$, this.favoriteBeers$])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([profile, rated, favorites]) => {
        if (profile) {
          this.totalBeers = rated?.length || 0
          this.averageRating = this.calculateAverageRating(rated || [])
          this.totalCountries = new Set((rated || []).map((beer) => beer.country)).size
          this.completionPercentage = this.calculateCompletionPercentage(profile)
          this.updateCharts(rated || [])
        }
      })
  }

  private initializeCharts(): void {
    this.initializeRatingDistributionChart()
    this.initializeBeerStylesChart()
    this.initializeRatingTrendChart()
    this.initializeAchievementsChart()
  }

  private initializeRatingDistributionChart(): void {
    const ctx = document.getElementById("ratingDistribution") as HTMLCanvasElement
    if (ctx) {
      this.ratingDistributionChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["1★", "2★", "3★", "4★", "5★"],
          datasets: [
            {
              label: "Number of Ratings",
              data: [0, 0, 0, 0, 0],
              backgroundColor: [
                "rgba(255, 99, 132, 0.5)",
                "rgba(54, 162, 235, 0.5)",
                "rgba(255, 206, 86, 0.5)",
                "rgba(75, 192, 192, 0.5)",
                "rgba(153, 102, 255, 0.5)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
              ],
              borderWidth: 1,
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
      })
    }
  }

  private initializeBeerStylesChart(): void {
    const ctx = document.getElementById("beerStyles") as HTMLCanvasElement
    if (ctx) {
      this.beerStylesChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
              backgroundColor: [
                "rgba(255, 99, 132, 0.5)",
                "rgba(54, 162, 235, 0.5)",
                "rgba(255, 206, 86, 0.5)",
                "rgba(75, 192, 192, 0.5)",
                "rgba(153, 102, 255, 0.5)",
              ],
            },
          ],
        },
        options: {
          responsive: true,
        },
      })
    }
  }

  private initializeRatingTrendChart(): void {
    const ctx = document.getElementById("ratingTrend") as HTMLCanvasElement
    if (ctx) {
      this.ratingTrendChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Rating Trend",
              data: [],
              borderColor: "rgba(75, 192, 192, 1)",
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 5,
            },
          },
        },
      })
    }
  }

  private initializeAchievementsChart(): void {
    const ctx = document.getElementById("achievements") as HTMLCanvasElement
    if (ctx) {
      this.achievementsChart = new Chart(ctx, {
        type: "radar",
        data: {
          labels: ["Ratings", "Countries", "Styles", "Favorites", "Reviews"],
          datasets: [
            {
              label: "Progress",
              data: [0, 0, 0, 0, 0],
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              pointBackgroundColor: "rgba(75, 192, 192, 1)",
            },
          ],
        },
        options: {
          responsive: true,
        },
      })
    }
  }

  private updateCharts(ratedBeers: RatedBeer[]): void {
    this.updateRatingDistribution(ratedBeers)
    this.updateBeerStyles(ratedBeers)
    this.updateRatingTrend(ratedBeers)
    this.updateAchievementsProgress()
  }

  private updateRatingDistribution(ratedBeers: RatedBeer[]): void {
    if (this.ratingDistributionChart) {
      const distribution = [0, 0, 0, 0, 0]
      ratedBeers.forEach((beer) => {
        distribution[Math.floor(beer.rating) - 1]++
      })

      this.ratingDistributionChart.data.datasets[0].data = distribution
      this.ratingDistributionChart.update()
    }
  }

  private updateBeerStyles(ratedBeers: RatedBeer[]): void {
    if (this.beerStylesChart) {
      const styles: { [key: string]: number } = {}
      ratedBeers.forEach((beer) => {
        styles[beer.beerType] = (styles[beer.beerType] || 0) + 1
      })

      const sortedStyles = Object.entries(styles)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)

      this.beerStylesChart.data.labels = sortedStyles.map(([style]) => style)
      this.beerStylesChart.data.datasets[0].data = sortedStyles.map(([, count]) => count)
      this.beerStylesChart.update()
    }
  }

  private updateRatingTrend(ratedBeers: RatedBeer[]): void {
    if (this.ratingTrendChart) {
      const sortedRatings = ratedBeers
        .filter((beer) => beer.ratedAt) // Filter out beers without ratedAt
        .sort((a, b) => (a.ratedAt?.toMillis() || 0) - (b.ratedAt?.toMillis() || 0))
        .slice(-10)

      this.ratingTrendChart.data.labels = sortedRatings.map(
        (beer) => beer.ratedAt?.toDate().toLocaleDateString() || "Unknown",
      )
      this.ratingTrendChart.data.datasets[0].data = sortedRatings.map((beer) => beer.rating)
      this.ratingTrendChart.update()
    }
  }

  private updateAchievementsProgress(): void {
    if (this.achievementsChart) {
      const progress = [70, 45, 60, 80, 55]
      this.achievementsChart.data.datasets[0].data = progress
      this.achievementsChart.update()
    }
  }

  private calculateAverageRating(ratedBeers: RatedBeer[]): number {
    if (!ratedBeers?.length) return 0
    const sum = ratedBeers.reduce((acc, beer) => acc + beer.rating, 0)
    return Number((sum / ratedBeers.length).toFixed(1))
  }

  private calculateCompletionPercentage(profile: UserProfile): number {
    return 75
  }

  removeFavoriteBeer(beerId: string): void {
    this.userService.removeFavoriteBeer(beerId)
    this.loadUserData()
  }

  removeRating(beerId: string): void {
    this.userService.removeUserRating(beerId)
    this.loadUserData()
  }

  markNotificationAsRead(id: string): void {
    this.notificationService.markAsRead(id)
    this.loadUserData()
  }

  requestNewBeer(): void {
    const dialogRef = this.dialog.open(NewBeerRequestComponent, {
      width: "400px",
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.beerService.submitNewBeerRequest(result)
        this.loadUserData()
      }
    })
  }

  changePassword(): void {
    this.router.navigate(["/forgot-password"])
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOut()
      this.router.navigate(["/login"])
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  loadUserData(): void {
    this.userProfile$ = this.userService.getCurrentUserProfile()
    this.favoriteBeers$ = this.userService.getUserFavoriteBeers()
    this.ratedBeers$ = this.userService.getUserRatedBeers()
  }

  startEditingBio(): void {
    this.isEditingBio = true
  }

  async saveBio(): Promise<void> {
    try {
      await this.userService.updateUserProfile({ bio: this.bioControl.value || "" })
      this.isEditingBio = false
      this.loadUserData()
    } catch (error) {
      console.error("Error updating bio:", error)
    }
  }

  cancelEditBio(): void {
    this.userProfile$.pipe(takeUntil(this.unsubscribe$)).subscribe((profile) => {
      this.bioControl.setValue(profile?.bio || "")
    })
    this.isEditingBio = false
  }
}

