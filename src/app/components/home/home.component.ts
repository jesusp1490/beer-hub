import { Component, OnInit } from '@angular/core';
import { BeerService } from '../../services/beer.service';
import { Beer } from '../beers/beers.interface';
import { Brand } from '../country/brand.interface';
import { Router } from '@angular/router'; // Importar Router para redirección

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  searchActive = false; // Indica si la búsqueda está activa
  filteredBeers: Beer[] = []; // Datos de cervezas filtradas
  bestRatedBeers: Beer[] = []; // Datos de cervezas mejor valoradas
  popularBrands: Brand[] = []; // Datos de marcas populares
  userFavoriteBeers: Beer[] = []; // Datos de cervezas favoritas de usuarios
  latestBeers: Beer[] = []; // Datos de cervezas añadidas recientemente
  countryId: string = ''; // Asignar valor correcto
  brandId: string = ''; // Asignar valor correcto

  constructor(
    private beerService: BeerService,
    private router: Router // Inyectar Router para redirección
  ) { }

  ngOnInit(): void {
    this.countryId = 'actualCountryId'; // Asigna el valor correcto aquí
    this.brandId = 'actualBrandId'; // Asigna el valor correcto aquí
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
      console.log('Popular Brands:', brands); // Verifica la estructura
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

  clearFilters(): void {
    this.filteredBeers = [];
    this.searchActive = false;
  }

  viewBeerDetails(beerId: string): void {
    console.log('Viewing details for beer:', beerId); // Depuración
    this.router.navigate(['/country', this.countryId, 'brands', this.brandId, 'beers', beerId]);
  }

  viewBrandBeers(brandId: string): void {
    console.log('Viewing beers for brand:', brandId); // Depuración
    if (this.countryId && brandId) {
      this.router.navigate(['/country', this.countryId, 'brands', brandId, 'beers']);
    } else {
      console.error('Invalid countryId or brandId');
    }
  }
}
