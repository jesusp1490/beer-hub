import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { MatTabsModule } from "@angular/material/tabs"
import { RouterModule } from "@angular/router"
import { RatedBeer, FavoriteBeer } from "../../../models/user.model"

@Component({
  selector: "app-rated-favorite-beers",
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTabsModule, RouterModule],
  templateUrl: "./rated-favorite-beers.component.html",
  styleUrls: ["./rated-favorite-beers.component.scss"],
})
export class RatedFavoriteBeersComponent {
  // Both lists are passed in from DashboardComponent, which owns the
  // subscriptions (consistent with how userProfile is passed down to
  // profile-section / ranking-section / statistics elsewhere in this
  // dashboard) rather than this component fetching its own data.
  @Input() ratedBeers: RatedBeer[] | null = null
  @Input() favoriteBeers: FavoriteBeer[] | null = null
  @Input() loading = false

  @Output() removeRating = new EventEmitter<string>()
  @Output() removeFavorite = new EventEmitter<string>()

  activeTab: "rated" | "favorites" = "rated"

  setTab(tab: "rated" | "favorites"): void {
    this.activeTab = tab
  }

  onRemoveRating(beerId: string): void {
    this.removeRating.emit(beerId)
  }

  onRemoveFavorite(beerId: string): void {
    this.removeFavorite.emit(beerId)
  }
}