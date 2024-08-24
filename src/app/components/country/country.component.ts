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

// country.component.ts

export class CountryComponent implements OnInit {
  country$: Observable<Country | undefined>;
  countryName: string = '';
  countryFlagUrl: string = '';
  brands: Brand[] = [];
  private countryId: string = ''; // Almacena el ID del país
  page: number = 0;
  pageSize: number = 10; // Número total de marcas por página
  visibleBrands: Brand[] = [];

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router
  ) {
    this.countryId = this.route.snapshot.paramMap.get('country') || '';
    this.country$ = this.firestore.doc<Country>(`countries/${this.countryId}`).valueChanges();
  }

  ngOnInit(): void {
    this.loadCountryData(this.countryId);
  }

  private loadCountryData(countryId: string): void {
    this.firestore.doc<Country>(`countries/${countryId}`).valueChanges().subscribe(country => {
      if (country) {
        this.countryName = country.name;
        this.countryFlagUrl = country.flagUrl;
        this.loadBrands(countryId); // Carga las marcas
      } else {
        console.error('Country not found');
      }
    });
  }

  private loadBrands(countryId: string): void {
    this.firestore.collection<Brand>('brands', ref => ref.where('countryId', '==', countryId))
      .valueChanges()
      .subscribe(brands => {
        this.brands = brands;
        this.updateVisibleBrands();
      });
  }

  private updateVisibleBrands(): void {
    const start = this.page * this.pageSize;
    const end = start + this.pageSize;
    this.visibleBrands = this.brands.slice(start, end);
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.updateVisibleBrands();
    }
  }

  nextPage(): void {
    if ((this.page + 1) * this.pageSize < this.brands.length) {
      this.page++;
      this.updateVisibleBrands();
    }
  }

  selectBrand(brandId: string): void {
    this.router.navigate([`/country/${this.countryId}/brands/${brandId}/beers`]);
  }

  get hasMoreBrands(): boolean {
    return (this.page + 1) * this.pageSize < this.brands.length;
  }

  getRows(): Brand[][] {
    const rows: Brand[][] = [];
    for (let i = 0; i < this.visibleBrands.length; i += 5) {
      rows.push(this.visibleBrands.slice(i, i + 5));
    }
    return rows;
  }
}
