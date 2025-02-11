import { Component, Input, type OnChanges, ViewChild, type ElementRef } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { Chart, type ChartConfiguration } from "chart.js/auto"
import { UserProfile } from "../../../models/user.model"

@Component({
  selector: "app-statistics",
  templateUrl: "./statistics.component.html",
  styleUrls: ["./statistics.component.scss"],
  standalone: true,
  imports: [CommonModule, MatCardModule],
})
export class StatisticsComponent implements OnChanges {
  @Input() userProfile: UserProfile | null = null
  @ViewChild("beerStylesChart") beerStylesChartRef!: ElementRef

  beerStylesChart: Chart | null = null
  totalBeersRated = 0
  countriesExplored = 0
  favoriteStyle = ""

  ngOnChanges(): void {
    this.updateStatistics()
    this.updateCharts()
  }

  private updateStatistics(): void {
    if (this.userProfile && this.userProfile.statistics) {
      this.totalBeersRated = this.userProfile.statistics.totalBeersRated || 0
      this.countriesExplored = this.userProfile.statistics.countriesExplored?.length || 0
      this.favoriteStyle = this.getFavoriteStyle()
    }
  }

  private getFavoriteStyle(): string {
    if (this.userProfile && this.userProfile.statistics && this.userProfile.statistics.beerTypeStats) {
      const beerTypeStats = this.userProfile.statistics.beerTypeStats
      return Object.keys(beerTypeStats).reduce((a, b) => (beerTypeStats[a] > beerTypeStats[b] ? a : b), "")
    }
    return ""
  }

  private updateCharts(): void {
    if (this.userProfile && this.beerStylesChartRef) {
      this.createBeerStylesChart()
    }
  }

  private createBeerStylesChart(): void {
    const ctx = this.beerStylesChartRef.nativeElement.getContext("2d")
    const data = this.userProfile?.statistics?.beerTypeStats || {}

    const config: ChartConfiguration = {
      type: "pie",
      data: {
        labels: Object.keys(data),
        datasets: [
          {
            data: Object.values(data),
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
            text: "Beer Styles Rated",
          },
        },
      },
    }

    if (this.beerStylesChart) {
      this.beerStylesChart.destroy()
    }
    this.beerStylesChart = new Chart(ctx, config)
  }
}

