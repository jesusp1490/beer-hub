import { Component, Input } from "@angular/core"
import { UserProfile } from "../../../models/user.model"

@Component({
  selector: "app-statistics",
  templateUrl: "./statistics.component.html",
  styleUrls: ["./statistics.component.scss"],
})
export class StatisticsComponent {
  @Input() userProfile: UserProfile | null = null

  get totalBeersRated(): number {
    return this.userProfile?.statistics?.totalBeersRated || 0
  }

  get countriesExplored(): number {
    return this.userProfile?.statistics?.countriesExplored?.length || 0
  }

  get favoriteStyle(): string {
    const beerTypeStats = this.userProfile?.statistics?.beerTypeStats || {}
    return Object.entries(beerTypeStats).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
  }
}

