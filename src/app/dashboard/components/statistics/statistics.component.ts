import { Component, Input, OnChanges, ViewChild, ElementRef } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { Chart, ChartConfiguration } from "chart.js/auto"
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

  ngOnChanges(): void {
    if (this.userProfile && this.beerStylesChartRef) {
      this.createBeerStylesChart()
    }
  }

  private createBeerStylesChart(): void {
    const ctx = this.beerStylesChartRef.nativeElement.getContext("2d")
    const data = this.userProfile?.statistics?.beerTypeStats || {}

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels: Object.keys(data),
        datasets: [
          {
            data: Object.values(data),
            backgroundColor: this.generateColors(Object.keys(data).length),
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Beer Styles Distribution",
            color: "#e0e0e0",
            font: {
              size: 16,
              weight: "bold",
              family: "'Montserrat', sans-serif",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#a0a0a0",
              font: {
                size: 12,
                family: "'Montserrat', sans-serif",
              },
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
          x: {
            ticks: {
              color: "#a0a0a0",
              font: {
                size: 12,
                family: "'Montserrat', sans-serif",
              },
            },
            grid: {
              display: false,
            },
          },
        },
      },
    }

    if (this.beerStylesChart) {
      this.beerStylesChart.destroy()
    }
    this.beerStylesChart = new Chart(ctx, config)
  }

  private generateColors(count: number): string[] {
    const baseColor = [255, 167, 38] // A shade of orange
    return Array.from({ length: count }, (_, i) => {
      const shade = 1 - (i / count) * 0.6 // Adjust this value to change color variation
      return `rgba(${baseColor[0] * shade}, ${baseColor[1] * shade}, ${baseColor[2] * shade}, 0.7)`
    })
  }
}

