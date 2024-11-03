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
            'ALE', 
            'AMBER ALE', 
            'BELGIAN BLONDE ALE', 
            'BELGIAN DARK ALE',
            'BELGIAN DUBBLE', 
            'BELGIAN GOLDEN ALE',
            'BELGIAN STRONG ALE', 
            'BELGIAN TRIPEL', 
            'BELGIAN WHITE ALE',
            'BIÈRE DE GARDE',
            'BLONDE ALE', 
            'BROWN ALE',
            'COFFEE ALE',  
            'FRUIT BEER', 
            'GINGER PALE ALE', 
            'HEFEWEIZEN', 
            'MILD ALE', 
            'NEIPA', 
            'PALE ALE', 
            'RED ALE', 
            'SAISON', 
            'SCOTCH ALE', 
            'SOUR ALE', 
            'SPICE ALE', 
            'SPICED BEER', 
            'PUMPKIN ALE', 
            'WHITE INDIA PALE ALE', 
            'AMERICAN INDIA PALE ALE', 
            'DOUBLE INDIA PALE ALE', 
            'INDIA PALE ALE', 
            'IMPERIAL TEQUILA ALE', 
            'SESSION INDIA PALE ALE', 
            'TRIPLE INDIA PALE ALE',
        ]
    },
    {
        name: 'Lager',
        types: [
            'AMERICAN LAGER', 
            'BOHEMIAN PILSNER', 
            'DARK LAGER', 
            'GERMAN PILSNER', 
            'HELLES', 
            'HELLES BOCK', 
            'INDIA PALE LAGER', 
            'LAGER', 
            'LIGHT LAGER', 
            'MÄRZEN', 
            'MÜNCHNER DUNKEL', 
            'PALE LAGER', 
            'RED LAGER', 
            'SCHWARZBIER', 
            'STRONG LAGER', 
            'TABLE BEER', 
            'DUNKEL', 
        ]
    },
    {
        name: 'Pilsner',
        types: [
            'PILS AMBRÉE', 
            'PILS BLONDE', 
            'PILSNER', 
            'STRONG PILSNER',
        ]
    },
    {
        name: 'Porter and Stout',
        types: [
            'BALTIC PORTER', 
            'DOUBLE STOUT', 
            'DRY STOUT', 
            'IMPERIAL STOUT', 
            'MILK STOUT', 
            'OATMEAL STOUT',
            'STOUT',  
            'PORTER', 
            'ROBUST PORTER', 
            'DUNKEL BOCK',
        ]
    },
    {
        name: 'Bock',
        types: [
            'BOCK', 
            'DOPPELBOCK', 
            'DUNKEL', 
            'WEIZENBOCK',
        ]
    },
    {
        name: 'Wheat and Others',
        types: [
            'AMERICAN WHEAT', 
            'HOPPY WHEAT BEER', 
            'HEFEWEIZEN',
            'KÖLSH', 
            'KRISTALLWEIZEN',
            'LICHTENHAINER', 
            'WEISSBIER',  
            'WITBIER',
        ]
    },
    {
        name: 'Specialties',
        types: [
            'ABBAYE BELGIAN STYLE', 
            'AMBER LAGER', 
            'BARLEYWINE', 
            'BARREL AGED BEER', 
            'BERLINER WEISSE', 
            'CIDER', 
            'FRUIT BEER', 
            'LOW ALCOHOL', 
            'NON-ALCOHOLIC LAGER', 
            'NON-ALCOHOLIC MALT', 
            'NON-ALCOHOLIC STOUT', 
            'NON-ALCOHOLIC WEISSBIER', 
            'RADLER', 
            'SHANDY',
            'SMOKED BEER',
            'SOUR BEER', 
            'SPECIAL BEER',
        ]
    },
    {
        name: 'Happoshu',
        types: [
            'HAPPOSHU', 
            
        ]
    },
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