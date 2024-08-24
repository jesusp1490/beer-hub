import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Beer } from '../beers/beers.interface'; // Asegúrate de que la ruta es correcta
import { Brand } from '../country/brand.interface'; // Asegúrate de que la ruta es correcta
import { Country } from '../country/country.interface'; // Asegúrate de que la ruta es correcta

@Component({
  selector: 'app-beer-details',
  templateUrl: './beer-details.component.html',
  styleUrls: ['./beer-details.component.scss']
})
export class BeerDetailsComponent implements OnInit {
  beer: Beer | undefined;
  brandName: string = '';
  countryName: string = '';
  countryFlagUrl: string = '';
  brandLogoUrl: string = '';

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore
  ) { }

  ngOnInit(): void {
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
        this.loadBrandData(this.beer.brandId);
        this.loadCountryData(this.beer.countryId);
      }
    });
  }

  private loadBrandData(brandId: string): void {
    this.firestore.collection<Brand>('brands').doc(brandId).valueChanges().subscribe(brand => {
      if (brand) {
        this.brandName = brand.name; // Accede a propiedades del tipo Brand
        this.brandLogoUrl = brand.logoUrl;
      }
    });
  }

  private loadCountryData(countryId: string): void {
    this.firestore.collection<Country>('countries').doc(countryId).valueChanges().subscribe(country => {
      if (country) {
        this.countryName = country.name; // Accede a propiedades del tipo Country
        this.countryFlagUrl = country.flagUrl;
      }
    });
  }
}
