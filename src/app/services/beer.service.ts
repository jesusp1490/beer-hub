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
        const name = filters.name.trim().toLowerCase();
        if (name) {
          query = query.where('name', '==', name) as CollectionReference<Beer>;
        }
      }

      // Apply filter by brand
      if (filters.brand) {
        const brand = filters.brand.trim().toLowerCase();
        if (brand) {
          query = query.where('brand', '==', brand) as CollectionReference<Beer>;
        }
      }

      // Apply filter by ABV
      if (filters.abv) {
        const abv = parseFloat(filters.abv);
        if (!isNaN(abv)) {
          query = query.where('abv', '==', abv) as CollectionReference<Beer>;
        }
      }

      // Apply filter by beer type
      if (filters.beerType) {
        const beerType = filters.beerType.trim().toLowerCase();
        if (beerType) {
          query = query.where('beerType', '==', beerType) as CollectionReference<Beer>;
        }
      }

      // Apply filter by ingredient
      if (filters.ingredient) {
        const ingredient = filters.ingredient.trim().toLowerCase();
        if (ingredient) {
          query = query.where('ingredients', 'array-contains', { name: ingredient }) as CollectionReference<Beer>;
        }
      }

      // Execute the query
      query.get().then(snapshot => {
        const beers: Beer[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as Beer;
          beers.push({ ...data, id: doc.id });
        });
        observer.next(beers);
        observer.complete();
      }).catch(error => {
        console.error('Error al obtener cervezas filtradas', error);
        observer.error(error);
      });
    });
  }
}