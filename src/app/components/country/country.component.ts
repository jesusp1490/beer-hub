import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Subject, forkJoin, BehaviorSubject, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Country } from './country.interface';
import { Brand } from './brand.interface';

@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss']
})
export class CountryComponent implements OnInit, OnDestroy {
  countryName: string = '';
  countryFlagUrl: string = '';
  brands: Brand[] = [];
  filteredBrands: Brand[] = [];
  private countryId: string = '';
  page: number = 0;
  pageSize: number = 10;
  visibleBrands: Brand[] = [];
  searchTerm$ = new BehaviorSubject<string>('');
  isLoading: boolean = true;
  notFound: boolean = false;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router,
  ) {
    this.countryId = this.route.snapshot.paramMap.get('country') || '';
  }

  ngOnInit(): void {
    this.loadCountryData(this.countryId);
    this.setupSearch();
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
          this.notFound = false;
          this.loadBrands(countryId);
        } else {
          console.error('Country not found');
          this.notFound = true;
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
    const imageLoadPromises = this.visibleBrands
      .filter(brand => !!brand.logoUrl)
      .map(brand => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = brand.logoUrl;
        });
      });

    forkJoin(imageLoadPromises.length ? imageLoadPromises : [Promise.resolve()])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
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
    if (brandId) {
      const route = `/country/${this.countryId}/brands/${brandId}/beers`;
      this.router.navigate([route]);
    }
  }

  get hasMoreBrands(): boolean {
    return (this.page + 1) * this.pageSize < this.filteredBrands.length;
  }

  private setupSearch(): void {
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.unsubscribe$)
    ).subscribe(term => {
      this.filteredBrands = this.filterBrands(term);
      this.page = 0;
      this.updateVisibleBrands();
    });
  }

  private filterBrands(term: string): Brand[] {
    return this.brands.filter(brand =>
      brand.name.toLowerCase().includes(term.toLowerCase())
    );
  }

  updateSearchTerm(term: string): void {
    this.searchTerm$.next(term);
  }
}
