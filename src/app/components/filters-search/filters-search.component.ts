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
  beerTypes: string[] = ['Ale', 'American Lager', 'American Pale Ale', 'American India Pale Ale', 'American Wheat', 'Amber Ale', 'Alsatian', 'Altbier', 'Barleywine', 'Barrel Aged Beer', 'Belgian Dark Ale', 'Belgian Dubble', 'Belgian Tripel', 'Blonde Ale', 'Bock', 'Brown Ale', 'Cider', 'DoppelBock', 'Dry Stout', 'Dunkel', 'Fruit Beer', 'German Pilsner', 'Gose', 'Hefeweizen', 'Helles', 'Imperial Stout', 'India Pale Ale', 'Kölsh', 'Lager', 'Lambic', 'Low Alcohol', 'MÄRZEN', 'Milk Stout', 'Münchner Dunkel', 'Neipa', 'Non-alcoholic Lager', 'Non-alcoholic Stout', 'Non-alcoholic Weissbier', 'Pale Ale', 'Pale Lager', 'Porter', 'Radler', 'Red Ale', 'Red India Pale Ale', 'Quadrupel', 'Saison', 'SCHWARZBIER', 'Scotch Ale', 'Shandy', 'Special Beer', 'Spiced Beer', 'Stout', 'Sour Ale', 'Vienna Lager', 'Weissbier', 'Witbier', 'Barleywine', 'Berliner Weisse'];

  constructor(private fb: FormBuilder, private beerService: BeerService) {
    this.filtersForm = this.fb.group({
      name: [''],
      brand: [''],
      abvRange: [11],
      beerType: [''],
      ingredient: ['']
    });
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const filters = this.filtersForm.value;
    console.log('Applying filters:', filters);

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

        console.log('Filtered beers:', this.filteredBeers);
      },
      (error) => {
        console.error('Error fetching filtered beers:', error);
      }
    );
  }
}
