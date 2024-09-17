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
    'ALE', 'AMERICAN LAGER', 'AMERICAN PALE ALE', 'AMERICAN INDIA PALE ALE', 'AMERICAN WHEAT', 'AMBER ALE', 
    'ALSATIAN', 'ALTBIER', 'BARLEYWINE', 'BARREL AGED BEER', 'BELGIAN DARK ALE', 'BELGIAN DUBBLE', 'BELGIAN TRIPEL', 
    'BLONDE ALE', 'BOCK', 'BROWN ALE', 'CIDER', 'DOPPELBOCK', 'DRY STOUT', 'DUNKEL', 'DUNKEL BOCK', 'FRUIT BEER', 'GERMAN PILSNER', 
    'GOSE', 'HEFEWEIZEN', 'HELLES', 'HELLES BOCK', 'IMPERIAL STOUT', 'INDIA PALE ALE', 'IRISH RED ALE', 'KÖLSH', 'LAGER', 'LAMBIC', 'LOW ALCOHOL', 
    'MÄRZEN', 'MILK STOUT', 'MÜNCHNER DUNKEL', 'NEIPA', 'NON-ALCOHOLIC LAGER', 'NON-ALCOHOLIC STOUT', 
    'NON-ALCOHOLIC WEISSBIER', 'PALE ALE', 'PALE LAGER', 'PORTER', 'RADLER', 'RED ALE', 'RED INDIA PALE ALE', 
    'QUADRUPEL', 'SAISON', 'SCHWARZBIER', 'SCOTCH ALE', 'SHANDY', 'SPECIAL BEER', 'SPICED BEER', 'STOUT', 
    'SOUR ALE', 'VIENNA LAGER', 'WEISSBIER', 'WITBIER', 'BARLEYWINE', 'BERLINER WEISSE'
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