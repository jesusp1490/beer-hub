import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Country } from './country.interface';
import { Brand } from './brand.interface';

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
  filteredBrands: Brand[] = []; // Array para las marcas filtradas
  private countryId: string = '';
  page: number = 0;
  pageSize: number = 10;
  visibleBrands: Brand[] = [];
  searchTerm: string = ''; // Término de búsqueda

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
        this.loadBrands(countryId);
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
        this.filteredBrands = brands; // Inicialmente, no hay filtro
        this.updateVisibleBrands();
      });
  }

  private updateVisibleBrands(): void {
    const start = this.page * this.pageSize;
    const end = start + this.pageSize;
    this.visibleBrands = this.filteredBrands.slice(start, end);
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.updateVisibleBrands();
    }
  }

  nextPage(): void {
    if ((this.page + 1) * this.pageSize < this.filteredBrands.length) {
      this.page++;
      this.updateVisibleBrands();
    }
  }

  selectBrand(brandId: string): void {
    const route = `/country/${this.countryId}/brands/${brandId}/beers`;
    this.router.navigate([route]);
  }

  get hasMoreBrands(): boolean {
    return (this.page + 1) * this.pageSize < this.filteredBrands.length;
  }

  getRows(): Brand[][] {
    const rows: Brand[][] = [];
    for (let i = 0; i < this.visibleBrands.length; i += 5) {
      rows.push(this.visibleBrands.slice(i, i + 5));
    }
    return rows;
  }

  filterBrands(): void {
    this.filteredBrands = this.brands.filter(brand => 
      brand.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.page = 0; // Reinicia a la primera página
    this.updateVisibleBrands();
  }
}
