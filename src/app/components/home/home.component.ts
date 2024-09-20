import { Component, OnInit, OnDestroy } from '@angular/core';
import { BeerService } from '../../services/beer.service';
import { AuthService } from '../../services/auth.service';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  searchActive = false;
  filteredBeers: Beer[] = [];
  bestRatedBeers: Beer[] = [];
  popularBrands: Brand[] = [];
  userFavoriteBeers: Beer[] = [];
  latestBeers: Beer[] = [];
  isLoggedIn: boolean = false;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private beerService: BeerService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getBestRatedBeers();
    this.getPopularBrands();
    this.getLatestBeers();
    this.getFavoriteBeers();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getFavoriteBeers(): void {
    this.authService.user$.pipe(takeUntil(this.unsubscribe$)).subscribe(user => {
      this.isLoggedIn = !!user;
      if (this.isLoggedIn) {
        this.getUserFavoriteBeers();
      } else {
        this.getRandomFavoriteBeers();
      }
    });
  }

  onSearchResults(results: Beer[]): void {
    this.filteredBeers = results;
    this.searchActive = results.length > 0;
  }

  getBestRatedBeers(): void {
    this.beerService.getBestRatedBeers().pipe(takeUntil(this.unsubscribe$)).subscribe(
      (beers: Beer[]) => {
        this.bestRatedBeers = beers;
      }
    );
  }

  getUserFavoriteBeers(): void {
    this.beerService.getUserFavoriteBeers().pipe(takeUntil(this.unsubscribe$)).subscribe(
      (beers: Beer[]) => {
        this.userFavoriteBeers = beers;
        console.log('User favorite beers:', this.userFavoriteBeers);
      },
      (error) => {
        console.error('Error fetching user favorite beers:', error);
      }
    );
  }

  getRandomFavoriteBeers(): void {
    this.beerService.getRandomFavoriteBeers().pipe(takeUntil(this.unsubscribe$)).subscribe(
      (beers: Beer[]) => {
        this.userFavoriteBeers = beers;
        console.log('Random favorite beers:', this.userFavoriteBeers);
      },
      (error) => {
        console.error('Error fetching random favorite beers:', error);
      }
    );
  }

  getPopularBrands(): void {
    this.beerService.getPopularBrands().pipe(takeUntil(this.unsubscribe$)).subscribe(
      (brands: Brand[]) => {
        this.popularBrands = brands;
      }
    );
  }

  getLatestBeers(): void {
    this.beerService.getLatestBeers().pipe(takeUntil(this.unsubscribe$)).subscribe(
      (beers: Beer[]) => {
        this.latestBeers = beers;
      }
    );
  }

  getIngredients(beer: Beer): string {
    return beer.ingredients && beer.ingredients.length > 0
      ? beer.ingredients.map(ing => ing.name).join(', ')
      : 'No ingredients listed';
  }

  viewBeerDetails(beer: Beer): void {
    this.router.navigate(['/beers', beer.id]);
  }

  viewBrandBeers(brand: Brand): void {
    this.router.navigate(['/brands', brand.id, 'beers']);
  }
}