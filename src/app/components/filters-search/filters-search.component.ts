import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
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
  filteredBeers: Beer[] = [];
  @Output() searchResults = new EventEmitter<Beer[]>();

  constructor(private fb: FormBuilder, private beerService: BeerService) {
    const beerTypeControls: { [key: string]: FormControl } = {};
    this.beerTypes.forEach(type => {
      beerTypeControls[type] = new FormControl(false);
    });

    this.filtersForm = this.fb.group({
      name: [''],
      brand: [''],
      abvRange: [10],
      ...beerTypeControls,
      ingredient: ['']
    });
  }

  ngOnInit(): void {
    console.log('Total beer types:', this.beerTypes.length);
    console.log('Form controls:', Object.keys(this.filtersForm.controls).length);
  }

  applyFilters(): void {
    const filters = this.filtersForm.value;
    const selectedBeerTypes = this.beerTypes.filter(type => filters[type]);

    const isEmptyFilter = !filters.name && !filters.brand && filters.abvRange === 0 && selectedBeerTypes.length === 0 && !filters.ingredient;

    if (isEmptyFilter) {
      this.filteredBeers = [];
      this.searchResults.emit([]);
      return;
    }

    this.beerService.getFilteredBeers({ ...filters, beerTypes: selectedBeerTypes }).subscribe(
      (beers: Beer[]) => {
        this.filteredBeers = beers;
        this.searchResults.emit(this.filteredBeers);
      },
      (error) => {
        console.error('Error fetching filtered beers:', error);
      }
    );
  }

  // Helper method to chunk the beer types array
  chunkArray(arr: any[], size: number): any[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  }
}