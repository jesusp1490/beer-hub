import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { BeerService } from '../../services/beer.service';
import { AuthService } from '../../services/auth.service';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';

type HomeTab = 'best-rated' | 'favorites' | 'latest' | 'search-results';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  activeTab: HomeTab = 'best-rated';

  private lastBrowseTab: 'best-rated' | 'favorites' | 'latest' = 'best-rated';

  bestRatedBeers: Beer[] = [];
  popularBrands: Brand[] = [];
  favoriteBeers: Beer[] = [];
  latestBeers: Beer[] = [];
  filteredBeers: Beer[] = [];

  isLoadingBestRated = false;
  isLoadingBrands = false;
  isLoadingFavorites = false;
  isLoadingLatest = false;

  private favoritesLoaded = false;
  private latestLoaded = false;

  isMobileView = false;

  featuredBeer: Beer | null = null;
  restOfBestRated: Beer[] = [];

  @ViewChild('searchResults') searchResultsElement: ElementRef | undefined;
  @ViewChild('filterSidebar') filterSidebarElement: ElementRef | undefined;
  private destroy$ = new Subject<void>();

  constructor(
    private beerService: BeerService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadBestRated();
    this.loadPopularBrands();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobileView = window.innerWidth < 768;
  }

  private loadBestRated(): void {
    this.isLoadingBestRated = true;
    this.beerService.getRandomBestRatedBeers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (beers) => {
          this.bestRatedBeers = beers;
          this.featuredBeer = beers.length > 0 ? beers[0] : null;
          this.restOfBestRated = beers.slice(1);
          this.isLoadingBestRated = false;
        },
        error: (error) => {
          console.error('Error loading best rated beers:', error);
          this.bestRatedBeers = [];
          this.featuredBeer = null;
          this.restOfBestRated = [];
          this.isLoadingBestRated = false;
        },
      });
  }

  private loadPopularBrands(): void {
    this.isLoadingBrands = true;
    this.beerService.getRandomPopularBrands()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (brands) => {
          this.popularBrands = brands;
          this.isLoadingBrands = false;
        },
        error: (error) => {
          console.error('Error loading popular brands:', error);
          this.popularBrands = [];
          this.isLoadingBrands = false;
        },
      });
  }

  private loadFavorites(): void {
    if (this.favoritesLoaded) return;
    this.isLoadingFavorites = true;
    this.authService.isLoggedIn()
      .pipe(
        switchMap((isLoggedIn) =>
          isLoggedIn ? this.beerService.getUserFavoriteBeers() : this.beerService.getPopularFavoriteBeers()
        ),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (beers) => {
          this.favoriteBeers = beers;
          this.favoritesLoaded = true;
          this.isLoadingFavorites = false;
        },
        error: (error) => {
          console.error('Error loading favorite beers:', error);
          this.favoriteBeers = [];
          this.isLoadingFavorites = false;
        },
      });
  }

  private loadLatest(): void {
    if (this.latestLoaded) return;
    this.isLoadingLatest = true;
    this.beerService.getLatestBeers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (beers) => {
          this.latestBeers = beers;
          this.latestLoaded = true;
          this.isLoadingLatest = false;
        },
        error: (error) => {
          console.error('Error loading latest beers:', error);
          this.latestBeers = [];
          this.isLoadingLatest = false;
        },
      });
  }

  setActiveTab(tab: 'best-rated' | 'favorites' | 'latest'): void {
    this.activeTab = tab;
    this.lastBrowseTab = tab;

    if (tab === 'best-rated') {
      this.loadBestRated();
    } else if (tab === 'favorites') {
      this.loadFavorites();
    } else if (tab === 'latest') {
      this.loadLatest();
    }
  }

  onSearch(results: Beer[]): void {
    this.filteredBeers = results;
    this.activeTab = 'search-results';
    this.scrollToSearchResults();
  }

  backToBrowse(): void {
    this.setActiveTab(this.lastBrowseTab);
  }

  scrollToSearchResults(): void {
    setTimeout(() => {
      if (this.searchResultsElement && this.isMobileView) {
        this.searchResultsElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  onViewBeerDetails(beerId: string): void {
    this.router.navigate(['/beers', beerId]);
  }

  onViewBrandBeers(brandId: string): void {
    this.router.navigate(['/brands', brandId, 'beers']);
  }

  scrollToFilters(): void {
    this.filterSidebarElement?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  refreshRandomBeers(): void {
    this.loadBestRated();
  }

  refreshRandomBrands(): void {
    this.loadPopularBrands();
  }
}
