import { Component, OnInit } from '@angular/core';
import { Beer } from '../beers/beers.interface';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  filteredBeers: Beer[] = [];

  ngOnInit(): void {
    // Aquí puedes inicializar la lógica necesaria
  }
}
