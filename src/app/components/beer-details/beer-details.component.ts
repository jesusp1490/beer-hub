import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Location } from '@angular/common';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';
import { Country } from '../country/country.interface';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

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
  favoriteIconUrl: string = 'assets/icons/empty-heart.svg';
  showRegisterModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private location: Location,
    private afAuth: AngularFireAuth,
    private router: Router
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

  private loadBeerData(beerId: string): void {
    this.firestore.collection<Beer>('beers').doc(beerId).valueChanges().subscribe(beer => {
      if (beer) {
        this.beer = beer;
        this.loadBrandData(beer.brandId);
        this.loadCountryData(beer.countryId);

        if (this.userId && beer.rating) {
          const userRating = beer.rating[this.userId];
          this.userRating = userRating !== undefined ? userRating : null;
        }

        this.updateFavoriteIcon();
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


  toggleFavorite(): void {
    if (!this.userId) {
      this.showRegisterModal = true;
      return;
    }

    const favoriteRef = this.firestore.collection('users').doc(this.userId).collection('favorites').doc(this.beer?.id);

    favoriteRef.get().subscribe(doc => {
      if (doc.exists) {
        // Eliminar de favoritos
        favoriteRef.delete().then(() => {
          this.favoriteIconUrl = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=deb3f900-e608-4712-9b9a-bd4410852187'; // Default icon URL
        });
      } else {
        // Añadir a favoritos
        favoriteRef.set({}).then(() => {
          this.favoriteIconUrl = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Ffull-crown.webp?alt=media&token=d52cdf3b-f0b6-4432-a921-7a16bfd62803'; // Filled icon URL
        });
      }
    });
  }


  updateFavoriteIcon(): void {
    if (!this.beer?.id || !this.userId) {
      this.favoriteIconUrl = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=deb3f900-e608-4712-9b9a-bd4410852187';
      return;
    }

    const favoriteRef = this.firestore.collection('users').doc(this.userId).collection('favorites').doc(this.beer.id);

    favoriteRef.get().subscribe(doc => {
      if (doc.exists) {
        this.favoriteIconUrl = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Ffull-crown.webp?alt=media&token=d52cdf3b-f0b6-4432-a921-7a16bfd62803'; // Filled icon URL
      } else {
        this.favoriteIconUrl = 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fempty-corwn.webp?alt=media&token=deb3f900-e608-4712-9b9a-bd4410852187'; // Default icon URL
      }
    });
  }


  goBack(): void {
    this.location.back();
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
  }

  goToRegister(): void {
    this.router.navigate(['/signup']);
  }
}