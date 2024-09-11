import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BeerService } from '../../services/beer.service';

@Component({
  selector: 'app-filters-search',
  templateUrl: './filters-search.component.html',
  styleUrls: ['./filters-search.component.scss']
})
export class FiltersSearchComponent implements OnInit {
  filtersForm: FormGroup;
  beerTypes: string[] = ['IPA', 'Lager', 'Stout', 'Pilsner']; // Ejemplo de tipos de cerveza

  constructor(private fb: FormBuilder, private beerService: BeerService) {
    this.filtersForm = this.fb.group({
      searchTerm: [''],
      beerType: [''],
      abvRange: [0],
      ingredient: ['']
    });
  }

  ngOnInit(): void {
    // Cualquier inicialización adicional
  }

  onSubmit() {
    if (this.filtersForm.valid) {
      const filters = this.filtersForm.value;
      this.beerService.getFilteredBeers(filters).subscribe(results => {
        // Manejar los resultados y actualizar la vista
        console.log('Filtered Beers:', results);
      });
    }
  }
}
