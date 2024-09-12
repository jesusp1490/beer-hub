import { Injectable } from '@angular/core';
import { AngularFirestore, CollectionReference } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Beer } from '../components/beers/beers.interface';

@Injectable({
  providedIn: 'root'
})
export class BeerService {
  constructor(private firestore: AngularFirestore) {}

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

      // Apply filter by ABV (string comparison)
      if (filters.abvRange) {
        const abv = filters.abvRange.toString();
        if (abv) {
          console.log(`Adding filter: ABV <= ${abv}`);
          query = query.where('ABV', '<=', abv) as CollectionReference<Beer>;
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
        console.log('Query result:', beers); // Log the query result
        // Pass the beers to the component
        observer.next(beers);
        observer.complete();
      }).catch(error => {
        console.error('Error getting filtered beers', error);
        observer.error(error);
      });
    });
  }
}
