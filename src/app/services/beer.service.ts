import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { Beer } from '../components/beers/beers.interface';
import { Brand } from '../components/country/brand.interface';
import { Country } from '../components/country/country.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BeerService {
  private cachedBeers$: Observable<Beer[]> | null = null;
  private cachedBrands$: Observable<Brand[]> | null = null;
  private cachedCountries$: Observable<Country[]> | null = null;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) { }

  getCountries(): Observable<Country[]> {
    if (!this.cachedCountries$) {
      this.cachedCountries$ = this.firestore.collection<Country>('countries').valueChanges({ idField: 'id' }).pipe(
        shareReplay(1)
      );
    }
    return this.cachedCountries$;
  }

  getCountryBeerCounts(): Observable<{ [countryId: string]: number }> {
    return this.firestore.collection<Beer>('beers').valueChanges().pipe(
      map(beers => {
        const countryCounts: { [countryId: string]: number } = {};
        beers.forEach(beer => {
          if (beer.countryId) {
            countryCounts[beer.countryId] = (countryCounts[beer.countryId] || 0) + 1;
          }
        });
        return countryCounts;
      }),
      shareReplay(1)
    );
  }

  private getBeers(): Observable<Beer[]> {
    if (!this.cachedBeers$) {
      this.cachedBeers$ = this.firestore.collection<Beer>('beers').valueChanges({ idField: 'id' }).pipe(
        shareReplay(1)
      );
    }
    return this.cachedBeers$;
  }

  private getBrands(): Observable<Brand[]> {
    if (!this.cachedBrands$) {
      this.cachedBrands$ = this.firestore.collection<Brand>('brands').valueChanges({ idField: 'id' }).pipe(
        shareReplay(1)
      );
    }
    return this.cachedBrands$;
  }

  getBestRatedBeers(): Observable<Beer[]> {
    return this.getBeers().pipe(
      map(beers => beers
        .filter(beer => beer.averageRating !== undefined)
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 6)
      )
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
          switchMap((favorites: any[]) => {
            if (favorites.length === 0) {
              return of([]);
            }
            const beerIds = favorites.map(f => f.beerId);
            return this.getBeers().pipe(
              map(beers => beers.filter(beer => beerIds.includes(beer.id)).slice(0, 6))
            );
          })
        );
      })
    );
  }

  getPopularBrands(): Observable<Brand[]> {
    return this.getBrands().pipe(
      map(brands => {
        const sortedBrands = brands.sort((a, b) => b.beersCount - a.beersCount);
        const topBrands = sortedBrands.slice(0, Math.min(20, sortedBrands.length));
        return this.getRandomSubset(topBrands, 6);
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
        .slice(0, 6)
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
        .then(docRef => docRef.id);
    } else {
      return Promise.reject(new Error('Invalid beer data'));
    }
  }

  refreshBeers(): void {
    this.cachedBeers$ = null;
    this.getBeers();
  }
}