import { Component, OnInit, OnDestroy } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"
import { Subject, forkJoin, of } from "rxjs"
import { takeUntil, catchError, finalize } from "rxjs/operators"
import { Beer } from "../beers/beers.interface"
import { BeerService } from "../../services/beer.service"
import { AuthService } from "../../services/auth.service"
import { trigger, transition, style, animate, query, stagger } from "@angular/animations"

@Component({
  selector: "app-beer-details",
  templateUrl: "./beer-details.component.html",
  styleUrls: ["./beer-details.component.scss"],
  animations: [
    trigger("fadeIn", [transition(":enter", [style({ opacity: 0 }), animate("500ms", style({ opacity: 1 }))])]),
    trigger("slideInFromLeft", [
      transition(":enter", [
        style({ transform: "translateX(-100%)", opacity: 0 }),
        animate("500ms ease-out", style({ transform: "translateX(0)", opacity: 1 })),
      ]),
    ]),
    trigger("slideInFromRight", [
      transition(":enter", [
        style({ transform: "translateX(100%)", opacity: 0 }),
        animate("500ms ease-out", style({ transform: "translateX(0)", opacity: 1 })),
      ]),
    ]),
    trigger("slideInFromBottom", [
      transition(":enter", [
        style({ transform: "translateY(100%)", opacity: 0 }),
        animate("500ms ease-out", style({ transform: "translateY(0)", opacity: 1 })),
      ]),
    ]),
    trigger("staggerList", [
      transition(":enter", [
        query(
          ":enter",
          [
            style({ opacity: 0, transform: "translateY(50px)" }),
            stagger("100ms", [animate("500ms ease-out", style({ opacity: 1, transform: "translateY(0px)" }))]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class BeerDetailsComponent implements OnInit, OnDestroy {
  beer: Beer | undefined
  brandName = ""
  brandLogoUrl = ""
  countryName = ""
  countryFlagUrl = ""
  countryMapUrl = ""
  userRating: number | null = null
  userId: string | null = null
  favoriteIconUrl =
    "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-crown.webp?alt=media&token=d6a7a1e5-1dcb-4c2d-8f34-87df6a9d2548"
  showRegisterModal = false
  isLoading = true
  private unsubscribe$ = new Subject<void>()
  animationState = {
    beerImageUrl: false,
    beerName: false,
    countryInfo: false,
    brandInfo: false,
    beerType: false,
    beerRating: false,
    description: false,
    web: false,
    stats: false,
    ingredients: false,
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private beerService: BeerService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    console.log("BeerDetailsComponent: Initializing component")
    this.authService.user$.pipe(takeUntil(this.unsubscribe$)).subscribe((user) => {
      this.userId = user ? user.uid : null
      console.log("BeerDetailsComponent: Current user ID:", this.userId)
      if (this.beer) {
        this.updateUserRating()
      }
    })

    this.route.paramMap.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
      const beerId = params.get("id")
      console.log("BeerDetailsComponent: Route params - Beer ID:", beerId)
      if (beerId) {
        this.loadBeerData(beerId)
      } else {
        console.error("BeerDetailsComponent: Beer ID not found in route parameters")
        this.handleBeerNotFound()
      }
    })
  }

  ngOnDestroy(): void {
    console.log("BeerDetailsComponent: Destroying component")
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private loadBeerData(beerId: string): void {
    this.isLoading = true
    console.log("BeerDetailsComponent: Fetching beer details for ID:", beerId)
    this.beerService
      .getBeerDetails(beerId)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError((error) => {
          console.error("BeerDetailsComponent: Error loading beer data:", error)
          this.isLoading = false
          return of(undefined)
        }),
      )
      .subscribe((beer) => {
        console.log("BeerDetailsComponent: Received beer data:", beer)
        if (beer) {
          this.beer = beer
          console.log("BeerDetailsComponent: Beer data set:", this.beer)
          this.updateUserRating()
          this.loadAdditionalData()
          this.preloadImages()
        } else {
          console.error("BeerDetailsComponent: Beer not found")
          this.handleBeerNotFound()
        }
        this.isLoading = false
      })
  }

  private handleBeerNotFound(): void {
    this.isLoading = false
    // You can add additional logic here, such as displaying an error message
    console.error("BeerDetailsComponent: Beer not found")
  }

  private updateUserRating(): void {
    console.log("BeerDetailsComponent: Updating user rating")
    if (this.userId && this.beer) {
      this.beerService
        .getUserRating(this.beer.id)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((rating) => {
          this.userRating = rating
          console.log("BeerDetailsComponent: User rating updated:", this.userRating)
        })
    }
  }

  rateBeer(rating: number): void {
    console.log("BeerDetailsComponent: Attempting to rate beer:", rating)
    if (!this.userId || !this.beer) {
      console.log("BeerDetailsComponent: User not logged in or beer not loaded, showing register modal")
      this.showRegisterModal = true
      return
    }

    this.beerService.rateBeer(this.beer.id, rating).subscribe(
      () => {
        console.log("BeerDetailsComponent: Beer rated successfully")
        this.userRating = rating
        this.loadBeerData(this.beer!.id)
      },
      (error) => {
        console.error("BeerDetailsComponent: Error updating rating: ", error)
      },
    )
  }

  deleteRating(): void {
    console.log("BeerDetailsComponent: Attempting to delete rating")
    if (!this.userId || !this.beer) {
      console.log("BeerDetailsComponent: User not logged in or beer not loaded, cannot delete rating")
      return
    }

    this.beerService.deleteUserRating(this.beer.id).subscribe(
      () => {
        console.log("BeerDetailsComponent: Rating deleted successfully")
        this.userRating = null
        this.loadBeerData(this.beer!.id)
      },
      (error) => {
        console.error("BeerDetailsComponent: Error deleting rating: ", error)
      },
    )
  }

  toggleFavorite(): void {
    console.log("BeerDetailsComponent: Attempting to toggle favorite")
    if (!this.userId) {
      console.log("BeerDetailsComponent: User not logged in, showing register modal")
      this.showRegisterModal = true
      return
    }

    if (!this.beer) {
      console.log("BeerDetailsComponent: Beer not loaded, cannot toggle favorite")
      return
    }

    this.beerService
      .toggleFavorite(this.beer.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (isFavorite) => {
          console.log("BeerDetailsComponent: Favorite toggled successfully:", isFavorite)
          this.favoriteIconUrl = isFavorite
            ? "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Ffull-crown.webp?alt=media&token=d52cdf3b-f0b6-4432-a921-7a16bfd62803"
            : "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=50ff92d3-eb61-44eb-9e99-fd3b9f460e4b"
        },
        (error) => {
          console.error("BeerDetailsComponent: Error toggling favorite: ", error)
        },
      )
  }

  closeRegisterModal(): void {
    console.log("BeerDetailsComponent: Closing register modal")
    this.showRegisterModal = false
  }

  goToRegister(): void {
    console.log("BeerDetailsComponent: Navigating to register page")
    this.router.navigate(["/signup"])
  }

  private preloadImages(): void {
    console.log("BeerDetailsComponent: Preloading images")
    if (!this.beer) {
      console.log("BeerDetailsComponent: No beer data, skipping image preload")
      this.isLoading = false
      return
    }

    const imagesToLoad = [
      this.beer.beerImageUrl,
      this.brandLogoUrl,
      this.countryFlagUrl,
      this.countryMapUrl,
      ...this.beer.ingredients.map((ing) => ing.ingImageUrl),
    ].filter((url) => url)

    console.log("BeerDetailsComponent: Images to preload:", imagesToLoad)

    const imageLoadPromises = imagesToLoad.map((url) => {
      return new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => resolve()
        img.src = url
      })
    })

    forkJoin(imageLoadPromises)
      .pipe(
        catchError((error) => {
          console.error("BeerDetailsComponent: Error preloading images:", error)
          return of(null)
        }),
        finalize(() => {
          this.isLoading = false
          this.triggerAnimations()
        }),
      )
      .subscribe()
  }

  private triggerAnimations(): void {
    console.log("BeerDetailsComponent: Triggering animations")
    const delay = 200
    setTimeout(() => (this.animationState.beerImageUrl = true), delay)
    setTimeout(() => (this.animationState.beerName = true), delay * 2)
    setTimeout(() => (this.animationState.countryInfo = true), delay * 3)
    setTimeout(() => (this.animationState.brandInfo = true), delay * 4)
    setTimeout(() => (this.animationState.beerType = true), delay * 5)
    setTimeout(() => (this.animationState.beerRating = true), delay * 6)
    setTimeout(() => (this.animationState.description = true), delay * 7)
    setTimeout(() => (this.animationState.web = true), delay * 8)
    setTimeout(() => (this.animationState.ingredients = true), delay * 9)
    setTimeout(() => (this.animationState.stats = true), delay * 10)
  }

  private loadAdditionalData(): void {
    if (!this.beer) {
      console.error("BeerDetailsComponent: Cannot load additional data, beer is undefined")
      return
    }

    console.log("BeerDetailsComponent: Loading additional data for beer:", this.beer.id)
    forkJoin({
      brand: this.beerService.getBrandDetails(this.beer.brandId),
      country: this.beerService.getCountryDetails(this.beer.countryId),
      isFavorite: this.beerService.isUserFavorite(this.beer.id),
    })
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError((error) => {
          console.error("BeerDetailsComponent: Error loading additional data:", error)
          return of({ brand: null, country: null, isFavorite: false })
        }),
      )
      .subscribe(
        ({ brand, country, isFavorite }) => {
          console.log("BeerDetailsComponent: Additional data loaded:", { brand, country, isFavorite })
          if (brand) {
            this.brandName = brand.name
            this.brandLogoUrl = brand.logoUrl
          }
          if (country) {
            this.countryName = country.name
            this.countryFlagUrl = country.flagUrl
            this.countryMapUrl = country.territoryImageUrl
          }
          this.favoriteIconUrl = isFavorite
            ? "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Ffull-crown.webp?alt=media&token=d52cdf3b-f0b6-4432-a921-7a16bfd62803"
            : "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=50ff92d3-eb61-44eb-9e99-fd3b9f460e4b"
        },
        (error) => console.error("BeerDetailsComponent: Error in subscribe of loadAdditionalData:", error),
      )
  }
}
