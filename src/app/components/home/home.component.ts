import { Component, OnInit } from '@angular/core';
import { BeerService } from '../../services/beer.service';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  searchActive = false;
  filteredBeers: Beer[] = [];
  bestRatedBeers: Beer[] = [];
  popularBrands: Brand[] = [];
  userFavoriteBeers: Beer[] = [];
  latestBeers: Beer[] = [];

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

  onSearchResults(results: Beer[]): void {
    this.filteredBeers = results;
    this.searchActive = results.length > 0;
  }

  getBestRatedBeers(): void {
    this.beerService.getBeers().subscribe((beers: Beer[]) => {
      this.bestRatedBeers = beers
        .filter((beer: Beer) => beer.averageRating !== undefined)
        .sort((a: Beer, b: Beer) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 5);
    });
  }

  getUserFavoriteBeers(): void {
    this.beerService.getBeers().subscribe((beers: Beer[]) => {
      this.userFavoriteBeers = beers
        .filter((beer: Beer) => beer.favoriteUsers && Object.keys(beer.favoriteUsers).length > 0)
        .sort((a: Beer, b: Beer) => Object.keys(b.favoriteUsers || {}).length - Object.keys(a.favoriteUsers || {}).length)
        .slice(0, 5);
    });
  }

  getPopularBrands(): void {
    this.beerService.getBrands().subscribe((brands: Brand[]) => {
      console.log('Popular Brands:', brands);
      this.popularBrands = brands.slice(0, 5);
    });
  }

  getLatestBeers(): void {
    this.beerService.getBeers().subscribe((beers: Beer[]) => {
      this.latestBeers = beers
        .sort((a: Beer, b: Beer) => {
          const dateA = a.addedDate ? new Date(a.addedDate).getTime() : 0;
          const dateB = b.addedDate ? new Date(b.addedDate).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
    });
  }

  getIngredients(beer: Beer): string {
    return beer.ingredients && beer.ingredients.length > 0
      ? beer.ingredients.map(ing => ing.name).join(', ')
      : 'No ingredients listed';
  }

  clearFilters(): void {
    this.filteredBeers = [];
    this.searchActive = false;
  }

  viewBeerDetails(beer: Beer): void {
    this.router.navigate(['/beers', beer.id]);
  }

  viewBrandBeers(brand: Brand): void {
    this.router.navigate(['/brands', brand.id, 'beers']);
  }
}