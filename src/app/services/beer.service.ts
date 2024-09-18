import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';
import { Beer } from '../components/beers/beers.interface';
import { Brand } from '../components/country/brand.interface';

@Injectable({
  providedIn: 'root'
})
export class BeerService {
  private cachedBeers$: Observable<Beer[]> | null = null;
  private cachedBrands$: Observable<Brand[]> | null = null;

  constructor(private firestore: AngularFirestore) { }

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
    return this.getBeers().pipe(
      map(beers => beers
        .filter(beer => beer.favoriteUsers && Object.keys(beer.favoriteUsers).length > 0)
        .sort((a, b) => Object.keys(b.favoriteUsers || {}).length - Object.keys(a.favoriteUsers || {}).length)
        .slice(0, 5)
      )
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
        ((beer.name && beer.name.includes(filters.searchTerm)) || 
         (beer.brand && beer.brand.includes(filters.searchTerm))) : true;
      const matchesBeerType = filters.beerTypes && filters.beerTypes.length > 0 ? 
        (beer.beerType && filters.beerTypes.includes(beer.beerType)) : true;
      const matchesAbv = filters.abvRange ? (beer.ABV !== undefined && beer.ABV <= filters.abvRange) : true;
      const matchesIngredient = filters.ingredient ?
        (beer.ingredients && Array.isArray(beer.ingredients) && 
         beer.ingredients.some(ing => ing && ing.name && ing.name.includes(filters.ingredient))) :
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