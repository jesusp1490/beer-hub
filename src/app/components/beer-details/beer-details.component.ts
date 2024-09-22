import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Location } from '@angular/common';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';
import { Country } from '../country/country.interface';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

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
  private unsubscribe$ = new Subject<void>();

  animationState = {
    beerImageUrl: false,
    countryInfo: false,
    mapAndBrand: false,
    beerStats: false,
    ratingSection: false,
    web: false,
    beerName: false,
    beerInfo: false,
    description: false,
    ingredients: false,
    leftSection: false,
    rightSection: false,
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
      const beerId = params.get('beerId');
      if (beerId) {
        this.loadBeerData(beerId);
      }
    });

    // Trigger animations sequentially
    setTimeout(() => this.animationState.beerImageUrl = true, 0);
    setTimeout(() => this.animationState.countryInfo = true, 500);
    setTimeout(() => this.animationState.mapAndBrand = true, 1000);
    setTimeout(() => this.animationState.beerStats = true, 1500);
    setTimeout(() => this.animationState.ratingSection = true, 2000);
    setTimeout(() => this.animationState.web = true, 2500);
    setTimeout(() => this.animationState.beerName = true, 3000);
    setTimeout(() => this.animationState.beerInfo = true, 3500);
    setTimeout(() => this.animationState.description = true, 4000);
    setTimeout(() => this.animationState.ingredients = true, 4500);
    setTimeout(() => this.animationState.leftSection = true, 5000);
    setTimeout(() => this.animationState.rightSection = true, 5500);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private loadBeerData(beerId: string): void {
    this.firestore.collection<Beer>('beers').doc(beerId).valueChanges()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(beer => {
        if (beer) {
          this.beer = beer;
          this.loadBrandData(beer.brandId);
          this.loadCountryData(beer.countryId);
          this.updateUserRating();
          this.updateFavoriteIcon();
        }
      });
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
    this.firestore.collection<Brand>('brands').doc(brandId).valueChanges().subscribe(brand => {
      if (brand) {
        this.brandName = brand.name;
        this.brandLogoUrl = brand.logoUrl;
      }
    });
  }

  private loadCountryData(countryId: string): void {
    this.firestore.collection<Country>('countries').doc(countryId).valueChanges().subscribe(country => {
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
}