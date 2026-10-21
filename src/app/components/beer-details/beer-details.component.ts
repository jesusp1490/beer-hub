import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { Beer } from '../beers/beers.interface';
import { BeerService } from '../../services/beer.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';
import { BeerPageData } from "../../resolvers/beer-page.resolver"

@Component({
  selector: 'app-beer-details',
  templateUrl: './beer-details.component.html',
  styleUrls: ['./beer-details.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideInFromLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate(
          '500ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 }),
        ),
      ]),
    ]),
    trigger('slideInFromRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate(
          '500ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 }),
        ),
      ]),
    ]),
    trigger('slideInFromBottom', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate(
          '500ms ease-out',
          style({ transform: 'translateY(0)', opacity: 1 }),
        ),
      ]),
    ]),
    trigger('staggerList', [
      transition(':enter', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(50px)' }),
            stagger('100ms', [
              animate(
                '500ms ease-out',
                style({ opacity: 1, transform: 'translateY(0px)' }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class BeerDetailsComponent implements OnInit, OnDestroy {
  beer: Beer | undefined;
  brandName = '';
  brandLogoUrl = '';
  countryName = '';
  countryFlagUrl = '';
  countryMapUrl = '';
  userRating: number | null = null;
  userId: string | null = null;
  favoriteIconUrl =
    'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-crown.webp?alt=media&token=d6a7a1e5-1dcb-4c2d-8f34-87df6a9d2548';
  showRegisterModal = false;
  isLoading = true;
  private unsubscribe$ = new Subject<void>();
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
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private beerService: BeerService,
    private authService: AuthService,
    private seo: SeoService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) { }

  ngOnInit(): void {
    this.authService.user$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((user) => {
        this.userId = user ? user.uid : null;
        if (this.beer) {
          this.updateUserRating();
        }
      });

        this.route.paramMap.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
      const beerId = params.get("id") ?? params.get("beerId")
      if (!beerId) {
        console.error("BeerDetailsComponent: Beer ID not found in route parameters")
        this.handleBeerNotFound()
        return
      }

      const resolved = this.route.snapshot.data["beerData"] as BeerPageData | undefined
      if (resolved) {
        if (resolved.beer) {
          this.applyResolvedData(resolved)
        } else {
          this.handleBeerNotFound()
        }
      } else {
        this.loadBeerData(beerId)
      }
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private loadBeerData(beerId: string): void {
    this.isLoading = true;
    this.beerService
      .getBeerDetails(beerId)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError((error) => {
          console.error(
            'BeerDetailsComponent: Error loading beer data:',
            error,
          );
          this.isLoading = false;
          return of(undefined);
        }),
      )
      .subscribe((beer) => {
        if (beer) {
          this.beer = beer;
          this.updateUserRating();
          this.loadAdditionalData();
          this.preloadImages();
        } else {
          console.error('BeerDetailsComponent: Beer not found');
          this.handleBeerNotFound();
        }
        this.isLoading = false;
      });
  }

    private applyResolvedData(data: BeerPageData): void {
    this.beer = data.beer
    if (data.brand) {
      this.brandName = data.brand.name
      this.brandLogoUrl = data.brand.logoUrl
    }
    if (data.country) {
      this.countryName = data.country.name
      this.countryFlagUrl = data.country.flagUrl
      this.countryMapUrl = data.country.territoryImageUrl
    }
    this.isLoading = false
    this.updateSeo()
    this.preloadImages()

    if (isPlatformBrowser(this.platformId)) {
      this.updateUserRating()
      this.loadFavoriteState()
    }
  }

  private loadFavoriteState(): void {
    if (!this.beer) return
    this.beerService
      .isUserFavorite(this.beer.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((isFavorite) => {
        this.favoriteIconUrl = isFavorite
          ? "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Ffull-crown.webp?alt=media&token=d52cdf3b-f0b6-4432-a921-7a16bfd62803"
          : "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=50ff92d3-eb61-44eb-9e99-fd3b9f460e4b"
      })
  }

  private handleBeerNotFound(): void {
    this.isLoading = false;
    console.error('BeerDetailsComponent: Beer not found');
    this.seo.update({
      title: 'Beer not found',
      description:
        'The beer you are looking for does not exist or has been removed.',
      path: this.router.url.split('?')[0],
      noindex: true,
    });
  }

  private updateUserRating(): void {
    if (this.userId && this.beer) {
      this.beerService
        .getUserRating(this.beer.id)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((rating) => {
          this.userRating = rating;
        });
    }
  }

  rateBeer(rating: number): void {
    if (!this.userId || !this.beer) {
      this.showRegisterModal = true;
      return;
    }

    this.beerService.rateBeer(this.beer.id, rating).subscribe({
      next: () => {
        this.userRating = rating;
        this.loadBeerData(this.beer!.id);
      },
      error: (error) => {
        console.error('BeerDetailsComponent: Error updating rating: ', error);
      },
    });
  }

  deleteRating(): void {
    if (!this.userId || !this.beer) {
      return;
    }

    this.beerService.deleteUserRating(this.beer.id).subscribe({
      next: () => {
        this.userRating = null;
        this.loadBeerData(this.beer!.id);
      },
      error: (error) => {
        console.error('BeerDetailsComponent: Error deleting rating: ', error);
      },
    });
  }

  toggleFavorite(): void {
    if (!this.userId) {
      this.showRegisterModal = true;
      return;
    }

    if (!this.beer) {
      return;
    }

    this.beerService
      .toggleFavorite(this.beer.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (isFavorite) => {
          this.favoriteIconUrl = isFavorite
            ? 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Ffull-crown.webp?alt=media&token=d52cdf3b-f0b6-4432-a921-7a16bfd62803'
            : 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=50ff92d3-eb61-44eb-9e99-fd3b9f460e4b';
        },
        error: (error) => {
          console.error(
            'BeerDetailsComponent: Error toggling favorite: ',
            error,
          );
        },
      });
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
  }

  goToRegister(): void {
    this.router.navigate(['/signup']);
  }

  private preloadImages(): void {
    const beer = this.beer;
    if (!beer) {
      this.isLoading = false;
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading = false;
      this.triggerAnimations();
      return;
    }

    const imagesToLoad = [
      beer.beerImageUrl,
      this.brandLogoUrl,
      this.countryFlagUrl,
      this.countryMapUrl,
      ...beer.ingredients.map((ing) => ing.ingImageUrl),
    ].filter((url) => url);

    const imageLoadPromises = imagesToLoad.map((url) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });
    });

    forkJoin(imageLoadPromises)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError((error) => {
          console.error(
            'BeerDetailsComponent: Error preloading images:',
            error,
          );
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.triggerAnimations();
        }),
      )
      .subscribe();
  }

  private triggerAnimations(): void {
    if (!isPlatformBrowser(this.platformId)) {
      Object.keys(this.animationState).forEach((key) => {
        (this.animationState as Record<string, boolean>)[key] = true;
      });
      return;
    }
    const delay = 200;
    setTimeout(() => (this.animationState.beerImageUrl = true), delay);
    setTimeout(() => (this.animationState.beerName = true), delay * 2);
    setTimeout(() => (this.animationState.countryInfo = true), delay * 3);
    setTimeout(() => (this.animationState.brandInfo = true), delay * 4);
    setTimeout(() => (this.animationState.beerType = true), delay * 5);
    setTimeout(() => (this.animationState.beerRating = true), delay * 6);
    setTimeout(() => (this.animationState.description = true), delay * 7);
    setTimeout(() => (this.animationState.web = true), delay * 8);
    setTimeout(() => (this.animationState.ingredients = true), delay * 9);
    setTimeout(() => (this.animationState.stats = true), delay * 10);
  }

  private loadAdditionalData(): void {
    if (!this.beer) {
      console.error(
        'BeerDetailsComponent: Cannot load additional data, beer is undefined',
      );
      return;
    }

    forkJoin({
      brand: this.beerService.getBrandDetails(this.beer.brandId),
      country: this.beerService.getCountryDetails(this.beer.countryId),
      isFavorite: this.beerService.isUserFavorite(this.beer.id),
    })
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError((error) => {
          console.error(
            'BeerDetailsComponent: Error loading additional data:',
            error,
          );
          return of({ brand: null, country: null, isFavorite: false });
        }),
      )
      .subscribe({
        next: ({ brand, country, isFavorite }) => {
          if (brand) {
            this.brandName = brand.name;
            this.brandLogoUrl = brand.logoUrl;
          }
          if (country) {
            this.countryName = country.name;
            this.countryFlagUrl = country.flagUrl;
            this.countryMapUrl = country.territoryImageUrl;
          }
          this.favoriteIconUrl = isFavorite
            ? 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Ffull-crown.webp?alt=media&token=d52cdf3b-f0b6-4432-a921-7a16bfd62803'
            : 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=50ff92d3-eb61-44eb-9e99-fd3b9f460e4b';
          this.updateSeo();
        },
        error: (error) =>
          console.error(
            'BeerDetailsComponent: Error in subscribe of loadAdditionalData:',
            error,
          ),
      });
  }

  private updateSeo(): void {
    if (!this.beer) return;
    const beer = this.beer;
    const brand = this.brandName || beer.brand;
    const origin = this.countryName ? ` from ${this.countryName}` : '';
    const stats = [
      beer.ABV ? `${beer.ABV}% ABV` : '',
      beer.IBU ? `${beer.IBU} IBU` : '',
    ]
      .filter(Boolean)
      .join(', ');

    this.seo.update({
      title: `${beer.name} - ${beer.beerType} by ${brand}`,
      description: `${beer.name}: ${beer.beerType} by ${brand}${origin}.${stats ? ' ' + stats + '.' : ''} ${beer.description ?? ''}`,
      path: `/beers/${encodeURIComponent(beer.id)}`,
      image: beer.beerImageUrl,
    });
  }
}
