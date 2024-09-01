import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';
import { Country } from '../country/country.interface';

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

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const beerId = params.get('beerId');
      console.log('Received beer ID:', beerId); // Depuración
      if (beerId) {
        this.loadBeerData(beerId);
      } else {
        console.error('No beer ID found in route params');
      }
    });
  }



  private loadBeerData(beerId: string): void {
    this.firestore.collection<Beer>('beers').doc(beerId).valueChanges().subscribe(beer => {
      if (beer) {
        this.beer = beer;
        this.loadBrandData(beer.brandId);
        this.loadCountryData(beer.countryId);
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
}
