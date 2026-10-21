import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { BeerService } from '../services/beer.service';
import { Beer } from '../components/beers/beers.interface';
import { Brand } from '../components/country/brand.interface';
import { Country } from '../components/country/country.interface';

export interface BeerPageData {
  beer: Beer | undefined;
  brand: Brand | undefined;
  country: Country | undefined;
}

export const beerPageResolver: ResolveFn<BeerPageData> = (route) => {
  const beerService = inject(BeerService);
  const empty: BeerPageData = { beer: undefined, brand: undefined, country: undefined };
  const id = route.paramMap.get('id') ?? route.paramMap.get('beerId');
  if (!id) return of(empty);

  return beerService.getBeerDetails(id).pipe(
    take(1),
    switchMap((beer) => {
      if (!beer) return of(empty);
      return forkJoin({
        brand: beerService.getBrandDetails(beer.brandId),
        country: beerService.getCountryDetails(beer.countryId),
      }).pipe(map(({ brand, country }) => ({ beer, brand, country })));
    }),
    catchError(() => of(empty)),
  );
};
