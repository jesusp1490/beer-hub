import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
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
    this.filtersForm = this.fb.group({
      name: [''],
      brand: [''],
      abvRange: [0],
      beerTypes: this.fb.array([]),
      ingredient: ['']
    });

    this.initBeerTypeCheckboxes();
  }

  ngOnInit(): void {}

  initBeerTypeCheckboxes(): void {
    const checkArray: FormArray = this.filtersForm.get('beerTypes') as FormArray;
    this.beerTypes.forEach(() => {
      checkArray.push(this.fb.control(false));
    });
  }

  onCheckboxChange(event: any, index: number): void {
    const checkArray: FormArray = this.filtersForm.get('beerTypes') as FormArray;
    checkArray.controls[index].setValue(event.target.checked);
  }

  applyFilters(): void {
    const filters = this.filtersForm.value;
    const selectedBeerTypes = filters.beerTypes
      .map((checked: boolean, index: number) => checked ? this.beerTypes[index] : null)
      .filter((type: string | null) => type !== null);

    const isEmptyFilter = !filters.name && !filters.brand && !filters.abvRange && selectedBeerTypes.length === 0 && !filters.ingredient;

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
}