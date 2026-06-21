import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
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
export class FilterSearchComponent implements OnInit, OnDestroy {
  checkboxColor: ThemePalette = 'accent';
  filtersForm: FormGroup;
  private readonly defaultFilters = {
    searchTerm: '',
    brand: '',
    beerTypes: [] as string[],
    abvMin: 0,
    abvMax: 20,
    ingredient: '',
  };

  beerTypeCategories: BeerTypeCategory[] = [
    {
      name: 'Ale',
      types: [
        'ALE', 'AMBER ALE', 'BELGIAN BLONDE ALE', 'BELGIAN DARK ALE', 'BELGIAN DUBBLE',
        'BELGIAN ENKEL', 'BELGIAN GOLDEN ALE', 'BELGIAN QUADRUPEL', 'BELGIAN STRONG ALE',
        'BELGIAN TRIPEL', 'BELGIAN WHITE ALE', 'BIÈRE DE GARDE', 'BLONDE ALE', 'BROWN ALE',
        'COFFEE ALE', 'ENGLISH ALE', 'FRUIT BEER', 'GINGER PALE ALE', 'MILD ALE', 'NEIPA',
        'AMERICAN PALE ALE', 'ENGLISH PALE ALE', 'PALE ALE', 'RED ALE', 'SAISON', 'SCOTCH ALE',
        'SOUR ALE', 'SPICE ALE', 'SPICED BEER', 'PUMPKIN ALE', 'AMERICAN INDIA PALE ALE',
        'DOUBLE INDIA PALE ALE', 'INDIA PALE ALE', 'IMPERIAL INDIA PALE ALE',
        'IMPERIAL TEQUILA ALE', 'RED INDIA PALE ALE', 'SESSION INDIA PALE ALE',
        'TRIPLE INDIA PALE ALE', 'WEST COAST INDIA PALE ALE', 'WHITE INDIA PALE ALE',
        'WILD ALE', 'WINTER ALE',
      ]
    },
    {
      name: 'Lager',
      types: [
        'AMBER LAGER', 'AMERICAN LAGER', 'BOHEMIAN PILSNER', 'CALIFORNIA COMMON', 'DARK LAGER',
        'DORTMUNDER', 'DUNKEL', 'GERMAN PILSNER', 'HELLES', 'INDIA PALE LAGER', 'KELLERBIER',
        'LAGER', 'LIGHT LAGER', 'MÄRZEN', 'MÜNCHNER HELLES', 'MÜNCHNER DUNKEL', 'PALE LAGER',
        'POLOTMAVÉ', 'RED LAGER', 'RYE LAGER', 'SCHWARZBIER', 'STRONG LAGER', 'SVĚTLÉ',
        'TABLE BEER', 'TMAVÉ', 'VIENNA', 'WINTER LAGER',
      ]
    },
    {
      name: 'Pilsner',
      types: ['IMPERIAL PILSNER', 'PILS AMBRÉE', 'PILS BLONDE', 'PILSNER', 'STRONG PILSNER']
    },
    {
      name: 'Porter and Stout',
      types: [
        'BALTIC PORTER', 'DOUBLE STOUT', 'DRY STOUT', 'RUSSIAN IMPERIAL STOUT', 'IMPERIAL STOUT',
        'IMPERIAL PORTER', 'IRISH STOUT', 'MILK STOUT', 'OATMEAL STOUT', 'STOUT', 'PORTER',
        'ROBUST PORTER', 'DUNKEL BOCK',
      ]
    },
    {
      name: 'Bock',
      types: ['BOCK', 'DOPPELBOCK', 'DUNKEL', 'EISBOCK', 'HELLES BOCK', 'MAIBOCK', 'WEIZENBOCK']
    },
    {
      name: 'Wheat and Others',
      types: [
        'AMERICAN WHEAT', 'ALTBIER', 'HOPPY WHEAT BEER', 'HEFEWEIZEN', 'KÖLSCH',
        'KRISTALLWEIZEN', 'LICHTENHAINER', 'WEISSBIER', 'WITBIER',
      ]
    },
    {
      name: 'Specialties',
      types: [
        'ABBAYE BELGIAN STYLE', 'AMBER LAGER', 'BARLEYWINE', 'BARREL AGED BEER',
        'BERLINER WEISSE', 'BIÈRE BRUT', 'CIDER', 'FRUIT BEER', 'HARD SELTZER', 'HONEY BEER',
        'KRIEK', 'LOW ALCOHOL', 'NON-ALCOHOLIC ALE', 'NON-ALCOHOLIC IPA', 'NON-ALCOHOLIC LAGER',
        'NON-ALCOHOLIC MALT', 'NON-ALCOHOLIC RADLER', 'NON-ALCOHOLIC STOUT',
        'NON-ALCOHOLIC WEISSBIER', 'RADLER', 'SHANDY', 'SMOKED BEER', 'SOUR BEER', 'SPECIAL BEER',
      ]
    },
    {
      name: 'Happoshu',
      types: ['HAPPOSHU']
    },
  ];

  @Output() searchResults = new EventEmitter<Beer[]>();
  @Output() searchPerformed = new EventEmitter<void>();
  @Output() filtersCleared = new EventEmitter<void>();
  @ViewChild('filterForm') filterForm: ElementRef | undefined;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private beerService: BeerService) {
    this.filtersForm = this.fb.group({ ...this.defaultFilters });
  }

  ngOnInit(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    const filters = this.filtersForm.value;
    this.beerService.getFilteredBeers(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (beers: Beer[]) => {
          this.searchResults.emit(beers);
          this.searchPerformed.emit();
        },
        error: (error) => {
          console.error('Error fetching filtered beers:', error);
        },
      });
  }

  isChecked(type: string): boolean {
    const beerTypes = this.filtersForm.get('beerTypes')?.value as string[];
    return beerTypes.includes(type);
  }

  updateBeerTypes(event: any, type: string): void {
    const beerTypes = [...(this.filtersForm.get('beerTypes')?.value as string[])];
    if (event.checked) {
      if (!beerTypes.includes(type)) {
        beerTypes.push(type);
      }
    } else {
      const index = beerTypes.indexOf(type);
      if (index > -1) {
        beerTypes.splice(index, 1);
      }
    }
    this.filtersForm.patchValue({ beerTypes });
  }

  clearFilters(): void {
    this.filtersForm.reset({ ...this.defaultFilters });
    this.filtersCleared.emit();
  }

  formatLabel(value: number): string {
    return value + '%';
  }
}
