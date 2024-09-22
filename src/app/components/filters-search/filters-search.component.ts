import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
    'ABBAYE BELGIAN STYLE', 'ALE', 'AMERICAN LAGER', 'AMERICAN PALE ALE', 'AMERICAN INDIA PALE ALE', 'AMERICAN WHEAT', 'AMBER ALE',
    'ALSATIAN', 'ALTBIER', 'BALTIC PORTER', 'BARLEYWINE', 'BARREL AGED BEER', 'BELGIAN BLONDE ALE', 'BELGIAN DARK ALE', 'BELGIAN DUBBLE', 'BELGIAN TRIPEL',
    'BLONDE ALE', 'BOCK', 'BOHEMIAN PILSNER', 'BROWN ALE', 'CIDER', 'DARK LAGER', 'DOUBLE INDIA PALE ALE', 'DOPPELBOCK', 'DRY STOUT', 'DUNKEL', 'DUNKEL BOCK', 'FRUIT BEER', 'GERMAN PILSNER',
    'GOSE', 'HEFEWEIZEN', 'HELLES', 'HELLES BOCK', 'IMPERIAL STOUT', 'INDIA PALE ALE', 'IRISH RED ALE', 'KÖLSH', 'LAGER', 'LAMBIC', 'LOW ALCOHOL',
    'MÄRZEN', 'MILK STOUT', 'MÜNCHNER DUNKEL', 'NEIPA', 'NON-ALCOHOLIC LAGER', 'NON-ALCOHOLIC STOUT',
    'NON-ALCOHOLIC WEISSBIER', 'OATMEAL STOUT', 'PALE ALE', 'PALE LAGER', 'PILSNER', 'PORTER', 'RADLER', 'RED ALE', 'RED INDIA PALE ALE',
    'QUADRUPEL', 'SAISON', 'SCHWARZBIER', 'SCOTCH ALE', 'SHANDY', 'SOUR ALE', 'SPECIAL BEER', 'SPICE ALE', 'SPICED BEER', 'STOUT', 'STRONG LAGER',
    'VIENNA LAGER', 'WEISSBIER', 'WITBIER', 'BARLEYWINE', 'BERLINER WEISSE'
  ];

  @Output() searchResults = new EventEmitter<Beer[]>();

  constructor(private fb: FormBuilder, private beerService: BeerService) {
    this.filtersForm = this.fb.group({
      searchTerm: [''],
      brand: [''],
      beerTypes: [[]],
      abvMin: [0],
      abvMax: [20],
      ingredient: ['']
    });
  }

  ngOnInit(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    const filters = this.filtersForm.value;
    this.beerService.getFilteredBeers(filters).subscribe(
      (beers: Beer[]) => {
        this.searchResults.emit(beers);
      },
      (error) => {
        console.error('Error fetching filtered beers:', error);
      }
    );
  }

  updateBeerTypes(event: Event, type: string): void {
    const beerTypes = this.filtersForm.get('beerTypes')?.value as string[];
    if ((event.target as HTMLInputElement).checked) {
      beerTypes.push(type);
    } else {
      const index = beerTypes.indexOf(type);
      if (index > -1) {
        beerTypes.splice(index, 1);
      }
    }
    this.filtersForm.patchValue({ beerTypes });
  }
}