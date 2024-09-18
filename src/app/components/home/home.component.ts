import { Component, OnInit, OnDestroy } from '@angular/core';
import { BeerService } from '../../services/beer.service';
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
  private unsubscribe$ = new Subject<void>();

  constructor(
    private beerService: BeerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getBestRatedBeers();
    this.getUserFavoriteBeers();
    this.getPopularBrands();
    this.getLatestBeers();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
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