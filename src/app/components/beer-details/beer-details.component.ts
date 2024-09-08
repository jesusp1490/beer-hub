import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Location } from '@angular/common';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';
import { Country } from '../country/country.interface';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-beer-details',
  templateUrl: './beer-details.component.html',
  styleUrls: ['./beer-details.component.scss']
})
export class BeerDetailsComponent implements OnInit {
  beer: Beer | undefined;
  brandName: string = '';
  brandLogoUrl: string = '';
  countryName: string = '';
  countryFlagUrl: string = '';
  countryMapUrl: string = '';
  userRating: number | null = null;
  userId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private location: Location,
    private afAuth: AngularFireAuth
  ) { }

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
      }
    });

    this.route.paramMap.subscribe(params => {
      const beerId = params.get('beerId');
      if (beerId) {
        this.loadBeerData(beerId);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  private loadBeerData(beerId: string): void {
    this.firestore.collection<Beer>('beers').doc(beerId).valueChanges().subscribe(beer => {
      if (beer) {
        this.beer = beer;
        this.loadBrandData(beer.brandId);
        this.loadCountryData(beer.countryId);

        // Load user rating if user is logged in
        if (this.userId && beer.rating) {
          const userRating = beer.rating[this.userId];
          this.userRating = userRating !== undefined ? userRating : null;
        }
      }
    });
  }

  private loadBrandData(brandId: string): void {
    this.firestore.collection<Brand>('brands').doc(brandId).valueChanges().subscribe(brand => {
      if (brand) {
        this.brandName = brand.name;
        this.brandLogoUrl = brand.logoUrl;
      }
    });
  }

  private loadCountryData(countryId: string): void {
    this.firestore.collection<Country>('countries').doc(countryId).valueChanges().subscribe(country => {
      if (country) {
        this.countryName = country.name;
        this.countryFlagUrl = country.flagUrl;
        this.countryMapUrl = country.territoryImageUrl;
      }
    });
  }

  splitIngredients(ingredients: any[]): any[][] {
    if (!ingredients) return [];
    const result = [];
    for (let i = 0; i < ingredients.length; i += 6) {
      result.push(ingredients.slice(i, i + 6));
    }
    return result;
  }

  rateBeer(rating: number): void {
    if (!this.userId || !this.beer) return;

    // Obtener las valoraciones actuales y añadir o actualizar la valoración del usuario
    const ratings = this.beer.rating || {};
    ratings[this.userId] = rating;

    // Calcular el total de las valoraciones
    const totalRating = Object.values(ratings).reduce((sum, r) => sum + r, 0);
    const totalUsers = Object.keys(ratings).length;

    // Calcular el nuevo promedio de las valoraciones
    const newAverageRating = (totalRating / totalUsers).toFixed(1);

    // Actualizar Firestore
    this.firestore.collection('beers').doc(this.beer.id).update({
      rating: ratings,
      averageRating: parseFloat(newAverageRating)
    }).then(() => {
      this.userRating = rating;
      if (this.beer) {
        this.beer.averageRating = parseFloat(newAverageRating);
      }
    }).catch(error => {
      console.error("Error updating document: ", error);
    });
  }


}
