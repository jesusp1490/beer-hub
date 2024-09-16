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

      if (filters.name) {
        const name = filters.name.trim();
        if (name) {
          console.log(`Adding filter: name == ${name}`);
          query = query.where('name', '==', name) as CollectionReference<Beer>;
        }
      }

      if (filters.brand) {
        const brand = filters.brand.trim();
        if (brand) {
          console.log(`Adding filter: brandId == ${brand}`);
          query = query.where('brandId', '==', brand) as CollectionReference<Beer>;
        }
      }

      if (filters.abvRange !== undefined) {
        const abvRange = Number(filters.abvRange);
        if (!isNaN(abvRange)) {
          console.log(`Adding filter: ABV <= ${abvRange}`);
          query = query.where('ABV', '<=', abvRange) as CollectionReference<Beer>;
        }
      }

      // Execute the query
      query.get().then(snapshot => {
        let beers: Beer[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as Beer;
          beers.push({ ...data, id: doc.id });
        });

        // Filter by beer types if any are selected
        if (filters.beerTypes && filters.beerTypes.length > 0) {
          beers = beers.filter(beer => filters.beerTypes.includes(beer.beerType));
        }

        // Filter by ingredient if provided
        if (filters.ingredient) {
          const ingredient = filters.ingredient.trim().toLowerCase();
          beers = beers.filter(beer => 
            beer.ingredients && Array.isArray(beer.ingredients) && 
            beer.ingredients.some(ing => ing && ing.name && ing.name.toLowerCase().includes(ingredient))
          );
        }

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
    return this.firestore.collection<Beer>('beers').valueChanges({ idField: 'id' });
  }

  getBrands(): Observable<Brand[]> {
    return this.firestore.collection<Brand>('brands').valueChanges({ idField: 'id' });
  }
}