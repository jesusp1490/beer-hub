import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { Country } from '../components/country/country.interface';
import { Brand } from '../components/country/brand.interface';
import { Beer } from '../components/beers/beers.interface';

export interface CountryPageData {
  country: Country | undefined;
  brands: Brand[];
}

export interface BrandPageData {
  brand: Brand | undefined;
  beers: Beer[];
}

export const countryPageResolver: ResolveFn<CountryPageData> = (route) => {
  const firestore = inject(AngularFirestore);
  const empty: CountryPageData = { country: undefined, brands: [] };
  const countryId = route.paramMap.get('country');
  if (!countryId) return of(empty);

  return firestore
    .doc<Country>(`countries/${countryId}`)
    .valueChanges()
    .pipe(
      take(1),
      switchMap((country) => {
        if (!country) return of(empty);
        return firestore
          .collection<Brand>('brands', (ref) => ref.where('countryId', '==', countryId))
          .valueChanges()
          .pipe(
            take(1),
            map((brands) => ({ country, brands })),
          );
      }),
      catchError(() => of(empty)),
    );
};

export const brandPageResolver: ResolveFn<BrandPageData> = (route) => {
  const firestore = inject(AngularFirestore);
  const empty: BrandPageData = { brand: undefined, beers: [] };
  const brandId = route.paramMap.get('brandId');
  if (!brandId) return of(empty);

  return forkJoin({
    brand: firestore.doc<Brand>(`brands/${brandId}`).valueChanges().pipe(take(1)),
    beers: firestore
      .collection<Beer>('beers', (ref) => ref.where('brandId', '==', brandId))
      .valueChanges({ idField: 'id' })
      .pipe(take(1)),
  }).pipe(catchError(() => of(empty)));
};

export const countryLinksResolver: ResolveFn<string[]> = () => {
  const firestore = inject(AngularFirestore);
  return firestore
    .collection<Country>('countries')
    .valueChanges({ idField: 'id' })
    .pipe(
      take(1),
      map((countries) => countries.map((c) => c.id).sort()),
      catchError(() => of([] as string[])),
    );
};
