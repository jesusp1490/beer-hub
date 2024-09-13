import { Component, OnInit } from '@angular/core';
import { BeerService } from '../../services/beer.service';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  filteredBeers: Beer[] = [];
  bestRatedBeers: Beer[] = [];
  userFavoriteBeers: Beer[] = [];
  popularBrands: Brand[] = [];
  latestBeers: Beer[] = [];

  constructor(private beerService: BeerService) {}

  ngOnInit(): void {
    this.loadBestRatedBeers();
    this.loadUserFavoriteBeers();
    this.loadPopularBrands();
    this.loadLatestBeers();
  }

  loadBestRatedBeers(): void {
    this.beerService.getBeers().subscribe(beers => {
      this.bestRatedBeers = beers
        .filter(beer => beer.averageRating) // Ensure there is an average rating
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)) // Sort by rating descending
        .slice(0, 10); // Show top 10
    });
  }

  loadUserFavoriteBeers(): void {
    this.beerService.getBeers().subscribe(beers => {
      this.userFavoriteBeers = beers
        .filter(beer => Object.keys(beer.favoriteUsers).length > 0) // Ensure there are favorite users
        .sort((a, b) => Object.keys(b.favoriteUsers).length - Object.keys(a.favoriteUsers).length) // Sort by number of favorite users descending
        .slice(0, 10); // Show top 10
    });
  }

  loadPopularBrands(): void {
    this.beerService.getBrands().subscribe(brands => {
      this.popularBrands = brands
        .map(brand => ({
          ...brand,
          beersCount: brand.beers ? brand.beers.length : 0
        }))
        .sort((a, b) => b.beersCount - a.beersCount) // Sort by number of beers descending
        .slice(0, 10); // Show top 10
    });
  }

  loadLatestBeers(): void {
    this.beerService.getBeers().subscribe(beers => {
      this.latestBeers = beers
        .sort((a, b) => (b.addedDate?.getTime() || 0) - (a.addedDate?.getTime() || 0)) // Sort by added date descending
        .slice(0, 10); // Show top 10
    });
  }
}
