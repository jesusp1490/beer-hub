import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Location } from '@angular/common';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';
import { Country } from '../country/country.interface';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Subject, forkJoin, EMPTY, of } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { BeerService } from '../../services/beer.service';

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
        animate('500ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
    ]),
    trigger('slideInFromRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
    ]),
    trigger('slideInFromBottom', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
    trigger('staggerList', [
      transition(':enter', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger('100ms', [
            animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0px)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class BeerDetailsComponent implements OnInit, OnDestroy {
  beer: Beer | undefined;
  brandName: string = '';
  brandLogoUrl: string = '';
  countryName: string = '';
  countryFlagUrl: string = '';
  countryMapUrl: string = '';
  userRating: number | null = null;
  userId: string | null = null;
  favoriteIconUrl: string = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-crown.webp?alt=media&token=d6a7a1e5-1dcb-4c2d-8f34-87df6a9d2548';
  showRegisterModal: boolean = false;
  isLoading: boolean = true;
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
    private firestore: AngularFirestore,
    private location: Location,
    private afAuth: AngularFireAuth,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.afAuth.authState.pipe(takeUntil(this.unsubscribe$)).subscribe(user => {
      this.userId = user ? user.uid : null;
      if (this.beer) {
        this.updateUserRating();
      }
    });

    this.route.paramMap.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const beerId = params.get('id');
      if (beerId) {
        this.loadBeerData(beerId);
      } else {
        console.error('Beer ID not found in route parameters');
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private loadBeerData(beerId: string): void {
    this.isLoading = true;
    this.firestore.collection<Beer>('beers').doc(beerId).valueChanges()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(error => {
          console.error('Error loading beer data:', error);
          this.isLoading = false;
          return EMPTY;
        })
      )
      .subscribe(beer => {
        if (beer) {
          this.beer = beer;
          this.loadBrandData(beer.brandId);
          this.loadCountryData(beer.countryId);
          this.updateUserRating();
          this.updateFavoriteIcon();
          this.preloadImages();
        } else {
          console.error('Beer not found');
          this.isLoading = false;
        }
      });
  }

  private preloadImages(): void {
    if (!this.beer) {
      this.isLoading = false;
      return;
    }

    const imagesToLoad = [
      this.beer.beerImageUrl,
      this.brandLogoUrl,
      this.countryFlagUrl,
      this.countryMapUrl,
      ...this.beer.ingredients.map(ing => ing.ingImageUrl)
    ].filter(url => url);

    const imageLoadPromises = imagesToLoad.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });
    });

    forkJoin(imageLoadPromises).pipe(
      catchError(error => {
        console.error('Error preloading images:', error);
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
        this.triggerAnimations();
      })
    ).subscribe();
  }

  private updateUserRating(): void {
    if (this.userId && this.beer && this.beer.rating) {
      const userRating = this.beer.rating[this.userId];
      this.userRating = userRating !== undefined ? userRating : null;
    } else {
      this.userRating = null;
    }
  }

  private loadBrandData(brandId: string): void {
    this.firestore.collection<Brand>('brands').doc(brandId).valueChanges().pipe(
      catchError(error => {
        console.error('Error loading brand data:', error);
        return EMPTY;
      })
    ).subscribe(brand => {
      if (brand) {
        this.brandName = brand.name;
        this.brandLogoUrl = brand.logoUrl;
      }
    });
  }

  private loadCountryData(countryId: string): void {
    this.firestore.collection<Country>('countries').doc(countryId).valueChanges().pipe(
      catchError(error => {
        console.error('Error loading country data:', error);
        return EMPTY;
      })
    ).subscribe(country => {
      if (country) {
        this.countryName = country.name;
        this.countryFlagUrl = country.flagUrl;
        this.countryMapUrl = country.territoryImageUrl;
      }
    });
  }

  rateBeer(rating: number): void {
    if (!this.userId) {
      this.showRegisterModal = true;
      return;
    }

    if (!this.beer) return;

    const ratings = this.beer.rating || {};
    ratings[this.userId] = rating;

    const totalRating = Object.values(ratings).reduce((sum, r) => sum + (r as number), 0);
    const totalUsers = Object.keys(ratings).length;

    const newAverageRating = (totalRating / totalUsers).toFixed(1);

    this.firestore.collection('beers').doc(this.beer.id).update({
      rating: ratings,
      averageRating: parseFloat(newAverageRating)
    }).then(() => {
      this.userRating = rating;
      if (this.beer) {
        this.beer.averageRating = parseFloat(newAverageRating);
      }
    }).catch(error => {
      console.error("Error updating document: ", error);
    });
  }

  toggleFavorite(): void {
    if (!this.userId) {
      this.showRegisterModal = true;
      return;
    }

    const favoriteRef = this.firestore.collection('users').doc(this.userId).collection('favorites').doc(this.beer?.id);

    favoriteRef.get().subscribe(doc => {
      if (doc.exists) {
        favoriteRef.delete().then(() => {
          this.favoriteIconUrl = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=deb3f900-e608-4712-9b9a-bd4410852187';
        });
      } else {
        favoriteRef.set({}).then(() => {
          this.favoriteIconUrl = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Ffull-crown.webp?alt=media&token=d52cdf3b-f0b6-4432-a921-7a16bfd62803';
        });
      }
    });
  }

  updateFavoriteIcon(): void {
    if (!this.beer?.id || !this.userId) {
      this.favoriteIconUrl = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=deb3f900-e608-4712-9b9a-bd4410852187';
      return;
    }

    const favoriteRef = this.firestore.collection('users').doc(this.userId).collection('favorites').doc(this.beer.id);

    favoriteRef.get().subscribe(doc => {
      if (doc.exists) {
        this.favoriteIconUrl = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Ffull-crown.webp?alt=media&token=d52cdf3b-f0b6-4432-a921-7a16bfd62803';
      } else {
        this.favoriteIconUrl = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=deb3f900-e608-4712-9b9a-bd4410852187';
      }
    });
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
  }

  goToRegister(): void {
    this.router.navigate(['/signup']);
  }

  private triggerAnimations(): void {
    const delay = 200;
    setTimeout(() => this.animationState.beerImageUrl = true, delay);
    setTimeout(() => this.animationState.beerName = true, delay * 2);
    setTimeout(() => this.animationState.countryInfo = true, delay * 3);
    setTimeout(() => this.animationState.brandInfo = true, delay * 4);
    setTimeout(() => this.animationState.beerType = true, delay * 5);
    setTimeout(() => this.animationState.beerRating = true, delay * 6);
    setTimeout(() => this.animationState.description = true, delay * 7);
    setTimeout(() => this.animationState.web = true, delay * 8);
    setTimeout(() => this.animationState.ingredients = true, delay * 9);
    setTimeout(() => this.animationState.stats = true, delay * 10);
  }
}

