import { Component, OnInit } from "@angular/core"
import { UserService } from "../services/user.service"
import { UserProfile } from "../models/user.model"
import { Chart } from "chart.js/auto"
import { MatDialog } from "@angular/material/dialog"
import { NewBeerRequestComponent } from "./components/new-beer-request/new-beer-request.component"
import { EditProfileComponent } from "./components/edit-profile/edit-profile.component"
import { Router } from "@angular/router"
import { AuthService } from "../services/auth.service"

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
  userProfile: UserProfile | null = null
  loading = true
  ratingChart: Chart | null = null
  styleChart: Chart | null = null
  countryChart: Chart | null = null

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUserProfile()
  }

  loadUserProfile(): void {
    this.userService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile
        this.loading = false
        this.initializeCharts()
      },
      error: (error) => {
        console.error("Error loading user profile:", error)
        this.loading = false
      },
    })
  }

  private initializeCharts(): void {
    this.initializeRatingChart()
    this.initializeStyleChart()
    this.initializeCountryChart()
  }

  private initializeRatingChart(): void {
    const ctx = document.getElementById("ratingChart") as HTMLCanvasElement
    if (ctx && this.userProfile?.statistics?.beerTypeStats) {
      const data = Object.entries(this.userProfile.statistics.beerTypeStats)
      this.ratingChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.map(([style]) => style),
          datasets: [
            {
              label: "Ratings by Style",
              data: data.map(([, count]) => count),
              borderColor: "#ff6b6b",
              tension: 0.4,
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
              text: "Beer Ratings by Style",
            },
          },
        },
      })
    }
  }

  private initializeStyleChart(): void {
    const ctx = document.getElementById("styleChart") as HTMLCanvasElement
    if (ctx && this.userProfile?.statistics?.beerTypeStats) {
      const data = Object.entries(this.userProfile.statistics.beerTypeStats)
      this.styleChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: data.map(([style]) => style),
          datasets: [
            {
              data: data.map(([, count]) => count),
              backgroundColor: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeead"],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "right",
            },
            title: {
              display: true,
              text: "Favorite Beer Styles",
            },
          },
        },
      })
    }
  }

  private initializeCountryChart(): void {
    const ctx = document.getElementById("countryChart") as HTMLCanvasElement
    if (ctx && this.userProfile?.statistics?.countriesExplored) {
      const countries = this.userProfile.statistics.countriesExplored
      this.countryChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: countries,
          datasets: [
            {
              label: "Countries Explored",
              data: countries.map(() => 1),
              backgroundColor: "#4ecdc4",
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
          plugins: {
            title: {
              display: true,
              text: "Beer Journey Map",
            },
          },
        },
      })
    }
  }

  openEditProfile(): void {
    const dialogRef = this.dialog.open(EditProfileComponent, {
      width: "400px",
      data: this.userProfile,
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUserProfile()
      }
    })
  }

  requestNewBeer(): void {
    const dialogRef = this.dialog.open(NewBeerRequestComponent, {
      width: "500px",
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle new beer request
      }
    })
  }

  logout(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(["/login"])
    })
  }
}

