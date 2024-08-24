import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Country } from './country.interface';
import { Brand } from './brand.interface';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss']
})
export class CountryComponent implements OnInit {
  country$: Observable<Country | undefined>;
  countryName: string = '';
  countryFlagUrl: string = '';
  brands: Brand[] = [];
  private countryId: string = ''; // Almacena el ID del país

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router 
  ) {
    this.countryId = this.route.snapshot.paramMap.get('country') || '';
    this.country$ = this.firestore.doc<Country>(`countries/${this.countryId}`).valueChanges();
  }

  ngOnInit(): void {
    this.country$.subscribe(country => {
      if (country) {
        this.countryName = country.name;
        this.countryFlagUrl = country.flagUrl;
        this.loadBrands(this.countryId); // Carga las marcas
      }
    });
  }

  private loadBrands(countryId: string): void {
    this.firestore.collection<Brand>('brands', ref => ref.where('countryId', '==', countryId))
      .valueChanges()
      .subscribe(brands => {
        this.brands = brands;
      });
  }

  selectBrand(brandId: string): void {
    this.router.navigate([`/country/${this.countryId}/brands/${brandId}/beers`]);
  }
}
