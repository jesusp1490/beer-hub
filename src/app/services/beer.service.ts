import { Injectable } from '@angular/core';
import { AngularFirestore, CollectionReference } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Beer } from '../components/beers/beers.interface';
import { Brand } from '../components/country/brand.interface';

@Injectable({
  providedIn: 'root'
})
export class BeerService {
  constructor(private firestore: AngularFirestore) { }

  getFilteredBeers(filters: any): Observable<Beer[]> {
    return new Observable(observer => {
      let query: CollectionReference<Beer> = this.firestore.collection('beers').ref as CollectionReference<Beer>;

      // Apply filter by name
      if (filters.name) {
        const name = filters.name.trim();
        if (name) {
          console.log(`Adding filter: name == ${name}`);
          query = query.where('name', '==', name) as CollectionReference<Beer>;
        }
      }


      // Apply filter by brand
      if (filters.brand) {
        const brand = filters.brand.trim();
        if (brand) {
          console.log(`Adding filter: brandId == ${brand}`);
          query = query.where('brandId', '==', brand) as CollectionReference<Beer>;
        }
      }

      // Apply filter by ABV
      if (filters.abvRange !== undefined) {
        const abvRange = Number(filters.abvRange);
        if (!isNaN(abvRange)) {
          console.log(`Adding filter: ABV <= ${abvRange}`);
          query = query.where('ABV', '<=', abvRange) as CollectionReference<Beer>;
        }
      }

      // Apply filter by beer type
      if (filters.beerType) {
        const beerType = filters.beerType.trim();
        if (beerType) {
          console.log(`Adding filter: beerType == ${beerType}`);
          query = query.where('beerType', '==', beerType) as CollectionReference<Beer>;
        }
      }

      // Execute the query
      query.get().then(snapshot => {
        const beers: Beer[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as Beer;
          beers.push({ ...data, id: doc.id });
        });
        console.log('Query result:', beers);
        observer.next(beers);
        observer.complete();
      }).catch(error => {
        console.error('Error getting filtered beers', error);
        observer.error(error);
      });
    });
  }

  getBeers(): Observable<Beer[]> {
    return new Observable(observer => {
      this.firestore.collection<Beer>('beers').valueChanges().subscribe(
        beers => {
          observer.next(beers);
          observer.complete();
        },
        error => {
          console.error('Error fetching beers', error);
          observer.error(error);
        }
      );
    });
  }

  getBrands(): Observable<Brand[]> {
    return new Observable(observer => {
      this.firestore.collection<Brand>('brands').valueChanges().subscribe(
        brands => {
          observer.next(brands);
          observer.complete();
        },
        error => {
          console.error('Error fetching brands', error);
          observer.error(error);
        }
      );
    });
  }
}