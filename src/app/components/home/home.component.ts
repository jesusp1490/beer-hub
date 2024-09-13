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
  searchActive = false; // Indica si la búsqueda está activa
  filteredBeers: any[] = []; // Datos de cervezas filtradas
  bestRatedBeers: any[] = []; // Datos de cervezas mejor valoradas
  popularBrands: any[] = []; // Datos de marcas populares
  userFavoriteBeers: any[] = []; // Datos de cervezas favoritas de usuarios
  latestBeers: any[] = []; // Datos de cervezas añadidas recientemente

  constructor(private beerService: BeerService) {}

  ngOnInit(): void {
    this.getBestRatedBeers();
    this.getUserFavoriteBeers();
    this.getPopularBrands();
    this.getLatestBeers();
  }

   onSearchResults(results: any[]) {
    this.filteredBeers = results;
    this.searchActive = results.length > 0;
  }

  getBestRatedBeers(): void {
    this.beerService.getBeers().subscribe((beers) => {
      this.bestRatedBeers = beers
        .filter((beer) => beer.averageRating) // Ensure there's an average rating
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5); // Show only top 5
    });
  }

  getUserFavoriteBeers(): void {
    this.beerService.getBeers().subscribe((beers) => {
      this.userFavoriteBeers = beers
        .filter((beer) => Object.keys(beer.favoriteUsers).length > 0) // Ensure there are favorites
        .sort((a, b) => Object.keys(b.favoriteUsers).length - Object.keys(a.favoriteUsers).length)
        .slice(0, 5); // Show only top 5
    });
  }

  getPopularBrands(): void {
    this.beerService.getBrands().subscribe((brands) => {
      this.popularBrands = brands.slice(0, 5); // Show only top 5
    });
  }

  getLatestBeers(): void {
    this.beerService.getBeers().subscribe((beers) => {
      this.latestBeers = beers
        .sort((a, b) => {
          const dateA = a.addedDate ? new Date(a.addedDate).getTime() : 0;
          const dateB = b.addedDate ? new Date(b.addedDate).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5); // Show only latest 5
    });
  }

   // Método para limpiar los filtros
  clearFilters() {
    this.filteredBeers = [];
    this.searchActive = false;
  }
}