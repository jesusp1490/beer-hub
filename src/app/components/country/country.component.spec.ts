import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Subject, forkJoin, BehaviorSubject, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
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
  // NEW: surfaced to the template so a "country not found" case shows a
  // message instead of silently rendering a blank page.
  notFound: boolean = false;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router,
  ) {
    this.countryId = this.route.snapshot.paramMap.get('country') || '';
    // FIX: removed the unused `country$` observable that was built here but
    // never subscribed to anywhere — loadCountryData() below already does
    // the real fetch of the same document. Keeping both was dead code that
    // made it look like there were two data-loading paths when there was
    // really only one.
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
    const imageLoadPromises = this.visibleBrands.map(brand => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = brand.logoUrl;
      });
    });

    // FIX: added takeUntil so this doesn't try to set isLoading on a
    // destroyed component if the user navigates away before image preload
    // finishes (e.g. clicking a brand quickly after the page loads).
    forkJoin(imageLoadPromises)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.isLoading = false;
      });
  }

  private updateVisibleBrands(): void {
    const start = this.page * this.pageSize;
    const end = start + this.pageSize;
    this.visibleBrands = this.filteredBrands.slice(start, end);

    while (this.visibleBrands.length < this.pageSize) {
      this.visibleBrands.push({} as Brand);
    }
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
      switchMap(term => {
        this.isLoading = true;
        return this.filterBrands(term);
      }),
      takeUntil(this.unsubscribe$)
    ).subscribe(filteredBrands => {
      this.filteredBrands = filteredBrands;
      this.page = 0;
      this.updateVisibleBrands();
      this.isLoading = false;
    });
  }

  private filterBrands(term: string): Observable<Brand[]> {
    return new Observable<Brand[]>(observer => {
      const filtered = this.brands.filter(brand =>
        brand.name.toLowerCase().includes(term.toLowerCase())
      );
      observer.next(filtered);
      observer.complete();
    });
  }

  updateSearchTerm(term: string): void {
    this.searchTerm$.next(term);
  }
}