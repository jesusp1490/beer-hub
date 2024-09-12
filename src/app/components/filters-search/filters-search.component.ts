import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BeerService } from '../../services/beer.service';
import { Beer } from '../beers/beers.interface';

@Component({
  selector: 'app-filter-search',
  templateUrl: './filters-search.component.html',
  styleUrls: ['./filters-search.component.scss']
})
export class FilterSearchComponent implements OnInit {
  filtersForm: FormGroup;
  filteredBeers: Beer[] = [];
  beerTypes: string[] = ['Lager', 'Ale', 'Stout', 'Pilsner', 'Porter', 'Radler'];

  constructor(private fb: FormBuilder, private beerService: BeerService) {
    this.filtersForm = this.fb.group({
      name: [''],
      brand: [''],
      abvRange: [10],
      beerType: [''],
      ingredient: ['']
    });
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const filters = this.filtersForm.value;
    console.log('Applying filters:', filters); // Log the filters being applied

    this.beerService.getFilteredBeers(filters).subscribe(
      (beers) => {
        if (filters.ingredient) {
          const ingredient = filters.ingredient.trim().toLowerCase();
          this.filteredBeers = beers.filter(beer =>
            (beer.ingredients || []).some(ing => ing.name && ing.name.toLowerCase() === ingredient)
          );
        } else {
          this.filteredBeers = beers;
        }

        console.log('Filtered beers:', this.filteredBeers); // Log the filtered beers
      },
      (error) => {
        console.error('Error fetching filtered beers:', error); // Log any errors
      }
    );
  }
}
