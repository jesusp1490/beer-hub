import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Country } from './country.interface';
import { Brand } from './brand.interface';

@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss']
})
export class CountryComponent implements OnInit, OnDestroy {
  country$: Observable<Country | undefined>;
  countryName: string = '';
  countryFlagUrl: string = '';
  brands: Brand[] = [];
  filteredBrands: Brand[] = [];
  private countryId: string = '';
  page: number = 0;
  pageSize: number = 10;
  visibleBrands: Brand[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router,
  ) {
    this.countryId = this.route.snapshot.paramMap.get('country') || '';
    this.country$ = this.firestore.doc<Country>(`countries/${this.countryId}`).valueChanges();
  }

  ngOnInit(): void {
    this.loadCountryData(this.countryId);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private loadCountryData(countryId: string): void {
    this.isLoading = true;
    this.firestore.doc<Country>(`countries/${countryId}`).valueChanges()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(country => {
        if (country) {
          this.countryName = country.name;
          this.countryFlagUrl = country.flagUrl;
          this.loadBrands(countryId);
        } else {
          console.error('Country not found');
          this.isLoading = false;
        }
      });
  }

  private loadBrands(countryId: string): void {
    this.firestore.collection<Brand>('brands', ref => ref.where('countryId', '==', countryId))
      .valueChanges()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(brands => {
        this.brands = brands;
        this.filteredBrands = brands;
        this.updateVisibleBrands();
        this.preloadImages();
      });
  }

  private preloadImages(): void {
    const imageLoadPromises = this.brands.map(brand => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve even on error to prevent blocking
        img.src = brand.logoUrl;
      });
    });

    forkJoin(imageLoadPromises).subscribe(() => {
      this.isLoading = false;
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
    console.log('Selected Brand ID:', brandId);
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
    this.page = 0;
    this.updateVisibleBrands();
  }

  goBack(): void {
    // Implement your back navigation logic here
  }
}