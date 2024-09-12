import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BeerService } from '../../services/beer.service';
import { Beer } from '../beers/beers.interface';

@Component({
  selector: 'app-filters-search',
  templateUrl: './filters-search.component.html',
  styleUrls: ['./filters-search.component.scss']
})
export class FilterSearchComponent implements OnInit {
  filtersForm = this.fb.group({
    searchTerm: [''],
    beerType: [''],
    abvRange: [100],
    ingredient: ['']
  });
  beerTypes: any;
  filteredBeers: Beer[] = [];

  constructor(
    private fb: FormBuilder,
    private beerService: BeerService
  ) { }

  ngOnInit(): void {
    // Cargar tipos de cerveza si es necesario
    this.loadBeerTypes();
  }

  loadBeerTypes(): void {
    // Aquí puedes cargar dinámicamente los tipos de cerveza
    this.beerTypes = ['Ale', 'Lager', 'Stout', 'Pilsner', 'India Pale Ale', 'Blond Ale'];
  }

  onSubmit(): void {
    const filters = this.filtersForm.value;

    // Usar el servicio para obtener las cervezas filtradas
    this.beerService.getFilteredBeers(filters).subscribe(
      (data: Beer[]) => {
        this.filteredBeers = data;
        console.log('Beers data:', this.filteredBeers);
      },
      error => {
        console.error('Error al obtener cervezas filtradas', error);
      }
    );
  }
}
