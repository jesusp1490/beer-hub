import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BeerService } from '../../services/beer.service';
import { Beer } from '../beers/beers.interface';
import { ThemePalette } from '@angular/material/core';

interface BeerTypeCategory {
  name: string;
  types: string[];
}

@Component({
  selector: 'app-filter-search',
  templateUrl: './filters-search.component.html',
  styleUrls: ['./filters-search.component.scss']
})
export class FilterSearchComponent implements OnInit {
  checkboxColor: ThemePalette = 'accent';
  filtersForm: FormGroup;
  beerTypeCategories: BeerTypeCategory[] = [
    {
      name: 'Ale',
      types: [
        'ALE', 'AMBER ALE', 'AMERICAN INDIA PALE ALE', 'AMERICAN PALE ALE',
        'DOUBLE INDIA PALE ALE', 'INDIA PALE ALE', 'NEIPA', 'PALE ALE',
        'RED ALE', 'RED INDIA PALE ALE', 'BELGIAN BLONDE ALE', 'BELGIAN DARK ALE',
        'BELGIAN DUBBLE', 'BELGIAN STRONG ALE', 'BELGIAN TRIPEL', 'BROWN ALE',
        'FRUIT BEER', 'GINGER PALE ALE', 'GOSE', 'HEFEWEIZEN', 'SAISON',
        'SCOTCH ALE', 'SOUR ALE', 'SPICE ALE', 'SPICED BEER', 'PUMPKIN ALE'
      ]
    },
    {
      name: 'Lager',
      types: [
        'AMERICAN LAGER', 'DARK LAGER', 'LAGER', 'PALE LAGER', 'BOHEMIAN PILSNER',
        'GERMAN PILSNER', 'MÄRZEN', 'VIENNA LAGER', 'HELLES', 'HELLES BOCK',
        'SCHWARZBIER', 'STRONG LAGER'
      ]
    },
    {
      name: 'Pilsner',
      types: ['PILSNER']
    },
    {
      name: 'Porter and Stout',
      types: [
        'BALTIC PORTER', 'DRY STOUT', 'IMPERIAL STOUT', 'MILK STOUT',
        'OATMEAL STOUT', 'PORTER', 'ROBUST PORTER', 'DUNKEL BOCK'
      ]
    },
    {
      name: 'Bock',
      types: ['BOCK', 'DOPPELBOCK', 'DUNKEL']
    },
    {
      name: 'Wheat and Others',
      types: ['AMERICAN WHEAT', 'WEISSBIER', 'WITBIER', 'KÖLSH']
    },
    {
      name: 'Specialties',
      types: [
        'ABBAYE BELGIAN STYLE', 'BARLEYWINE', 'BARREL AGED BEER', 'LAMBIC',
        'LOW ALCOHOL', 'NON-ALCOHOLIC LAGER', 'NON-ALCOHOLIC MALT',
        'NON-ALCOHOLIC STOUT', 'NON-ALCOHOLIC WEISSBIER', 'RADLER', 'BERLINER WEISSE'
      ]
    }
  ];

  @Output() searchResults = new EventEmitter<Beer[]>();
  @Output() searchPerformed = new EventEmitter<void>();
  @ViewChild('filterForm') filterForm: ElementRef | undefined;

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
        this.searchPerformed.emit();
      },
      (error) => {
        console.error('Error fetching filtered beers:', error);
      }
    );
  }

  updateBeerTypes(event: any, type: string): void {
    const beerTypes = this.filtersForm.get('beerTypes')?.value as string[];
    if (event.checked) {
      beerTypes.push(type);
    } else {
      const index = beerTypes.indexOf(type);
      if (index > -1) {
        beerTypes.splice(index, 1);
      }
    }
    this.filtersForm.patchValue({ beerTypes });
  }

  formatLabel(value: number): string {
    return value + '%';
  }
}