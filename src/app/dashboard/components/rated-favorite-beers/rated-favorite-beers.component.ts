import { Component, Input, Output, EventEmitter, OnChanges } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { RouterModule } from "@angular/router"
import { RatedBeer, FavoriteBeer } from "../../../models/user.model"

@Component({
  selector: "app-rated-favorite-beers",
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: "./rated-favorite-beers.component.html",
  styleUrls: ["./rated-favorite-beers.component.scss"],
})
export class RatedFavoriteBeersComponent implements OnChanges {
  @Input() ratedBeers: RatedBeer[] | null = null
  @Input() favoriteBeers: FavoriteBeer[] | null = null
  @Input() loading = false

  @Output() removeRating = new EventEmitter<string>()
  @Output() removeFavorite = new EventEmitter<string>()

  activeTab: "rated" | "favorites" = "rated"

  readonly pageSize = 6
  ratedPage = 0
  favoritesPage = 0

  ngOnChanges(): void {
    // Clamp page indices if the underlying list shrank (e.g. after a
    // removal) so we don't end up showing an empty page past the end.
    this.ratedPage = Math.min(this.ratedPage, this.maxPage(this.ratedBeers))
    this.favoritesPage = Math.min(this.favoritesPage, this.maxPage(this.favoriteBeers))
  }

  setTab(tab: "rated" | "favorites"): void {
    this.activeTab = tab
  }

  get pagedRatedBeers(): RatedBeer[] {
    return this.paginate(this.ratedBeers, this.ratedPage)
  }

  get pagedFavoriteBeers(): FavoriteBeer[] {
    return this.paginate(this.favoriteBeers, this.favoritesPage)
  }

  get ratedTotalPages(): number {
    return this.totalPages(this.ratedBeers)
  }

  get favoritesTotalPages(): number {
    return this.totalPages(this.favoriteBeers)
  }

  prevPage(): void {
    if (this.activeTab === "rated") {
      this.ratedPage = Math.max(0, this.ratedPage - 1)
    } else {
      this.favoritesPage = Math.max(0, this.favoritesPage - 1)
    }
  }

  nextPage(): void {
    if (this.activeTab === "rated") {
      this.ratedPage = Math.min(this.maxPage(this.ratedBeers), this.ratedPage + 1)
    } else {
      this.favoritesPage = Math.min(this.maxPage(this.favoriteBeers), this.favoritesPage + 1)
    }
  }

  private paginate<T>(list: T[] | null, page: number): T[] {
    if (!list) return []
    const start = page * this.pageSize
    return list.slice(start, start + this.pageSize)
  }

  private totalPages(list: unknown[] | null): number {
    if (!list || list.length === 0) return 1
    return Math.ceil(list.length / this.pageSize)
  }

  private maxPage(list: unknown[] | null): number {
    return Math.max(0, this.totalPages(list) - 1)
  }

  onRemoveRating(beerId: string): void {
    this.removeRating.emit(beerId)
  }

  onRemoveFavorite(beerId: string): void {
    this.removeFavorite.emit(beerId)
  }
}
