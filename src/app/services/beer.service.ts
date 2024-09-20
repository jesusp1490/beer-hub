import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, forkJoin, of } from 'rxjs';
import { map, tap, shareReplay, switchMap, take } from 'rxjs/operators';
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
        .slice(0, 5)
      )
    );
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
            return this.firestore.collection<Beer>('beers', ref => 
              ref.where('id', 'in', beerIds).limit(5)
            ).valueChanges({ idField: 'id' });
          })
        );
      })
    );
  }

  getRandomFavoriteBeers(): Observable<Beer[]> {
    return this.getBeers().pipe(
      take(1),
      map(beers => {
        const shuffled = beers.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 5);
      })
    );
  }

  getPopularBrands(): Observable<Brand[]> {
    return this.getBrands().pipe(
      map(brands => brands
        .sort((a, b) => b.beersCount - a.beersCount)
        .slice(0, 5)
      )
    );
  }

  getLatestBeers(): Observable<Beer[]> {
    return this.getBeers().pipe(
      map(beers => beers
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
      map(beers => this.applyFilters(beers, filters))
    );
  }

  private applyFilters(beers: Beer[], filters: any): Beer[] {
    return beers.filter(beer => {
      const matchesSearchTerm = filters.searchTerm ? 
        ((beer.name && beer.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) || 
         (beer.brand && beer.brand.toLowerCase().includes(filters.searchTerm.toLowerCase()))) : true;
      const matchesBeerType = filters.beerTypes && filters.beerTypes.length > 0 ? 
        (beer.beerType && filters.beerTypes.includes(beer.beerType)) : true;
      const matchesAbv = filters.abvRange ? (beer.ABV !== undefined && beer.ABV <= filters.abvRange) : true;
      const matchesIngredient = filters.ingredient ?
        (beer.ingredients && Array.isArray(beer.ingredients) && 
         beer.ingredients.some(ing => ing && ing.name && ing.name.toLowerCase().includes(filters.ingredient.toLowerCase()))) :
        true;

      return matchesSearchTerm && matchesBeerType && matchesAbv && matchesIngredient;
    });
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
}