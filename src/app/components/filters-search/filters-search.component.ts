import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
  beerTypes: string[] = [
    'Ale', 'American Lager', 'American Pale Ale', 'American India Pale Ale', 'American Wheat', 'Amber Ale', 
    'Alsatian', 'Altbier', 'Barleywine', 'Barrel Aged Beer', 'Belgian Dark Ale', 'Belgian Dubble', 'Belgian Tripel', 
    'Blonde Ale', 'Bock', 'Brown Ale', 'Cider', 'DoppelBock', 'Dry Stout', 'Dunkel', 'Fruit Beer', 'German Pilsner', 
    'Gose', 'Hefeweizen', 'Helles', 'Imperial Stout', 'India Pale Ale', 'Kölsh', 'Lager', 'Lambic', 'Low Alcohol', 
    'MÄRZEN', 'Milk Stout', 'Münchner Dunkel', 'Neipa', 'Non-alcoholic Lager', 'Non-alcoholic Stout', 
    'Non-alcoholic Weissbier', 'Pale Ale', 'Pale Lager', 'Porter', 'Radler', 'Red Ale', 'Red India Pale Ale', 
    'Quadrupel', 'Saison', 'SCHWARZBIER', 'Scotch Ale', 'Shandy', 'Special Beer', 'Spiced Beer', 'Stout', 
    'Sour Ale', 'Vienna Lager', 'Weissbier', 'Witbier', 'Barleywine', 'Berliner Weisse'
  ];
  filteredBeers: Beer[] = []; // Define filteredBeers here
  @Output() searchResults = new EventEmitter<Beer[]>(); // Emit the search results

  constructor(private fb: FormBuilder, private beerService: BeerService) {
    this.filtersForm = this.fb.group({
      name: [''],
      brand: [''],
      abvRange: [0],
      beerType: [''],
      ingredient: ['']
    });
  }

  ngOnInit(): void {}

  applyFilters(): void {
  const filters = this.filtersForm.value;
  const isEmptyFilter = !filters.name && !filters.brand && !filters.abvRange && !filters.beerType && !filters.ingredient;

  if (isEmptyFilter) {
    this.filteredBeers = []; // Clear filteredBeers if no filters
    this.searchResults.emit([]); // Emit empty array if no filters
    return;
  }

  this.beerService.getFilteredBeers(filters).subscribe(
    (beers: Beer[]) => { // Specify type for beers
      this.filteredBeers = beers;
      this.searchResults.emit(this.filteredBeers); // Emit filtered beers
    },
    (error) => {
      console.error('Error fetching filtered beers:', error);
    }
  );
}

}
