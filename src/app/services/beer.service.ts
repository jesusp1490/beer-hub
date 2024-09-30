import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, shareReplay, switchMap, tap, take, catchError } from 'rxjs/operators';
import { Beer } from '../components/beers/beers.interface';
import { Brand } from '../components/country/brand.interface';
import { Country } from '../components/country/country.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BeerService {
  private cachedBeers$ = new BehaviorSubject<Beer[]>([]);
  private cachedBrands$ = new BehaviorSubject<Brand[]>([]);
  private cachedCountries$ = new BehaviorSubject<Country[]>([]);
  private cachedCountryBeerCounts$ = new BehaviorSubject<{ [countryId: string]: number }>({});
  private lastFetchTime: number = 0;
  private cacheExpirationTime = 5 * 60 * 1000; // 5 minutes

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {
    this.initializeCache();
  }

  private initializeCache(): void {
    this.getBeers().pipe(take(1)).subscribe();
    this.getBrands().pipe(take(1)).subscribe();
    this.getCountries().pipe(take(1)).subscribe();
    this.getCountryBeerCounts().pipe(take(1)).subscribe();
  }

  private shouldRefetchCache(): boolean {
    return Date.now() - this.lastFetchTime > this.cacheExpirationTime;
  }

  getCountries(): Observable<Country[]> {
    if (this.shouldRefetchCache()) {
      this.firestore.collection<Country>('countries').valueChanges({ idField: 'id' }).pipe(
        take(1),
        tap(countries => {
          this.cachedCountries$.next(countries);
          this.lastFetchTime = Date.now();
        }),
        catchError(error => {
          console.error('Error fetching countries:', error);
          return of([]);
        })
      ).subscribe();
    }
    return this.cachedCountries$.asObservable();
  }

  getCountryBeerCounts(): Observable<{ [countryId: string]: number }> {
    return this.firestore.collection<Beer>('beers').valueChanges()
      .pipe(
        map(beers => {
          const countryCounts: { [countryId: string]: number } = {};
          beers.forEach(beer => {
            if (beer.countryId) {
              countryCounts[beer.countryId] = (countryCounts[beer.countryId] || 0) + 1;
            }
          });
          return countryCounts;
        }),
        catchError(error => {
          console.error('Error fetching country beer counts:', error);
          return of({});
        })
      );
  }

  private getBeers(): Observable<Beer[]> {
    if (this.shouldRefetchCache()) {
      this.firestore.collection<Beer>('beers').valueChanges({ idField: 'id' }).pipe(
        take(1),
        tap(beers => {
          this.cachedBeers$.next(beers);
          this.lastFetchTime = Date.now();
        }),
        catchError(error => {
          console.error('Error fetching beers:', error);
          return of([]);
        })
      ).subscribe();
    }
    return this.cachedBeers$.asObservable();
  }

  private getBrands(): Observable<Brand[]> {
    if (this.shouldRefetchCache()) {
      this.firestore.collection<Brand>('brands').valueChanges({ idField: 'id' }).pipe(
        take(1),
        tap(brands => {
          this.cachedBrands$.next(brands);
          this.lastFetchTime = Date.now();
        }),
        catchError(error => {
          console.error('Error fetching brands:', error);
          return of([]);
        })
      ).subscribe();
    }
    return this.cachedBrands$.asObservable();
  }

  getRandomBestRatedBeers(limit: number = 8): Observable<Beer[]> {
    return this.getBeers().pipe(
      map(beers => {
        const bestRated = beers
          .filter(beer => beer.averageRating !== undefined && beer.averageRating >= 4.0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        return this.getRandomSubset(bestRated, limit);
      })
    );
  }

  getRandomPopularBrands(limit: number = 8): Observable<Brand[]> {
    return this.getBrands().pipe(
      map(brands => {
        const sortedBrands = brands.sort((a, b) => b.beersCount - a.beersCount);
        const topBrands = sortedBrands.slice(0, Math.min(50, sortedBrands.length));
        return this.getRandomSubset(topBrands, limit);
      })
    );
  }

  private getRandomSubset<T>(array: T[], n: number): T[] {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  getUserFavoriteBeers(): Observable<Beer[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        return this.firestore.collection(`users/${user.uid}/favorites`).valueChanges({ idField: 'id' }).pipe(
          take(1),
          switchMap((favorites: any[]) => {
            if (favorites.length === 0) {
              return of([]);
            }
            const beerIds = favorites.map(f => f.beerId);
            return this.getBeers().pipe(
              map(beers => beers.filter(beer => beerIds.includes(beer.id)).slice(0, 5))
            );
          })
        );
      })
    );
  }

  getLatestBeers(): Observable<Beer[]> {
    return this.getBeers().pipe(
      map(beers => beers
        .filter(beer => beer.addedDate !== undefined)
        .sort((a, b) => {
          const dateA = a.addedDate ? new Date(a.addedDate).getTime() : 0;
          const dateB = b.addedDate ? new Date(b.addedDate).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5)
      )
    );
  }

  getFilteredBeers(filters: any): Observable<Beer[]> {
    return this.getBeers().pipe(
      map(beers => beers.filter(beer => {
        const matchesSearchTerm = filters.searchTerm ?
          beer.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) : true;

        const matchesBrand = filters.brand ?
          beer.brandId?.toLowerCase().includes(filters.brand.toLowerCase()) : true;

        const matchesBeerType = filters.beerTypes && filters.beerTypes.length > 0 ?
          filters.beerTypes.includes(beer.beerType) : true;

        const matchesIngredient = filters.ingredient ?
          beer.ingredients?.some(ing => ing.name?.toLowerCase().includes(filters.ingredient.toLowerCase())) : true;

        const matchesAbv = beer.ABV !== undefined ?
          (beer.ABV >= filters.abvMin && beer.ABV <= filters.abvMax) : true;

        return matchesSearchTerm && matchesBrand && matchesBeerType && matchesIngredient && matchesAbv;
      }))
    );
  }

  getBeersByBrand(brandId: string): Observable<Beer[]> {
    return this.getBeers().pipe(
      map(beers => beers.filter(beer => beer.brandId === brandId))
    );
  }

  getBeerDetails(beerId: string): Observable<Beer | undefined> {
    return this.getBeers().pipe(
      map(beers => beers.find(beer => beer.id === beerId))
    );
  }

  getPopularFavoriteBeers(): Observable<Beer[]> {
    return this.firestore.collectionGroup('favorites').valueChanges().pipe(
      take(1),
      map(favorites => {
        const beerCounts: { [key: string]: number } = {};
        favorites.forEach((fav: any) => {
          beerCounts[fav.beerId] = (beerCounts[fav.beerId] || 0) + 1;
        });
        return Object.entries(beerCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([beerId]) => beerId);
      }),
      switchMap(popularBeerIds =>
        this.getBeers().pipe(
          map(beers => beers.filter(beer => popularBeerIds.includes(beer.id)))
        )
      )
    );
  }

  validateBeer(beer: Partial<Beer>): beer is Required<Beer> {
    return (
      typeof beer.name === 'string' &&
      typeof beer.brand === 'string' &&
      typeof beer.beerType === 'string' &&
      Array.isArray(beer.ingredients) &&
      beer.ingredients.every(ing => typeof ing.name === 'string') &&
      typeof beer.ABV === 'number'
    );
  }

  addBeer(beer: Partial<Beer>): Promise<string> {
    if (this.validateBeer(beer)) {
      return this.firestore.collection('beers').add(beer)
        .then(docRef => {
          this.refreshCache();
          return docRef.id;
        });
    } else {
      return Promise.reject(new Error('Invalid beer data'));
    }
  }

  refreshCache(): void {
    this.lastFetchTime = 0;
    this.initializeCache();
  }
}