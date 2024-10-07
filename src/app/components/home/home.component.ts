import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { BeerService } from '../../services/beer.service';
import { AuthService } from '../../services/auth.service';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  activeTab: 'best-rated' | 'favorites' | 'latest' | 'search-results' = 'best-rated';
  bestRatedBeers$: Observable<Beer[]>;
  popularBrands$: Observable<Brand[]>;
  favoriteBeers$: Observable<Beer[]>;
  latestBeers$: Observable<Beer[]>;
  isLoggedIn$: Observable<boolean>;
  filteredBeers: Beer[] = [];
  isMobileView: boolean = false;

  @ViewChild('searchResults') searchResultsElement: ElementRef | undefined;

  constructor(
    private beerService: BeerService,
    private authService: AuthService,
    private router: Router
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn();
    this.bestRatedBeers$ = this.beerService.getRandomBestRatedBeers();
    this.popularBrands$ = this.beerService.getRandomPopularBrands();
    this.latestBeers$ = this.beerService.getLatestBeers();
    this.favoriteBeers$ = this.isLoggedIn$.pipe(
      switchMap(isLoggedIn => isLoggedIn ? this.beerService.getUserFavoriteBeers() : this.beerService.getPopularFavoriteBeers())
    );
  }

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobileView = window.innerWidth < 768;
  }

  setActiveTab(tab: 'best-rated' | 'favorites' | 'latest'): void {
    this.activeTab = tab;
    if (tab === 'best-rated') {
      this.bestRatedBeers$ = this.beerService.getRandomBestRatedBeers();
    }
  }

  onSearch(results: Beer[]): void {
    this.filteredBeers = results;
    this.activeTab = 'search-results';
    this.scrollToSearchResults();
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

  getBeerTypeIcon(beerType: string): string {
    return 'beer';
  }

  refreshRandomBeers(): void {
    this.bestRatedBeers$ = this.beerService.getRandomBestRatedBeers();
  }

  refreshRandomBrands(): void {
    this.popularBrands$ = this.beerService.getRandomPopularBrands();
  }
}