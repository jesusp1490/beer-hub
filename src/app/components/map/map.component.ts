import { Component, OnInit, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import { Router } from '@angular/router';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width = 1000;
  private height = 800;
  private countries: any[] = []; // Almacenar los países del GeoJSON
  private filteredCountries: any[] = []; // Almacenar países filtrados
  private searchText: string = ''; // Texto de búsqueda

  constructor(private el: ElementRef, private router: Router) { }

  ngOnInit(): void {
    this.createSvg();
    this.loadMapData();
  }

  private createSvg(): void {
    this.svg = d3.select(this.el.nativeElement)
      .select('.map-container')
      .append('svg')
      .attr('width', '100%')  // Hacer que sea responsivo
      .attr('height', '90%') // Hacer que sea responsivo
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet'); // Mantener la proporción
  }

  private loadMapData(): void {
    const projection = geoMercator()
      .scale(180)
      .translate([this.width / 2, this.height / 1.40]);

    const path = geoPath().projection(projection);

    d3.json('assets/custom110m.geo.json').then((data: any) => {
      if (!data) {
        console.error('No se cargaron datos');
        return;
      }

      this.countries = data.features; // Almacenar todos los países
      this.filteredCountries = this.countries; // Inicialmente, mostrar todos los países
      this.drawMap(this.filteredCountries, path);
    });
  }

  private drawMap(countries: any[], path: any): void {
    this.svg.selectAll('path').remove(); // Limpiar antes de redibujar

    this.svg.selectAll('path')
      .data(countries)
      .enter()
      .append('path')
      .attr('d', (d: any) => path(d) as string)
      .attr('fill', '#BDC3C7')
      .attr('stroke', '#747474')
      .attr('stroke-width', 1)
      .on('mouseover', function (event: any, d: any) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('fill', '#8A8A8A')  // Color hover
          .attr('filter', 'drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.5))');
      })
      .on('mouseout', function (event: any, d: any) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('fill', '#BDC3C7')  // Color original
          .attr('filter', 'none');
      })
      .on('click', (event: any, d: any) => {
        this.onCountrySelect(d.properties.name);
      });
  }

  private onCountrySelect(country: string): void {
    console.log('País seleccionado:', country);
    // Navegar a la página de cervezas del país seleccionado o realizar otra acción
    this.router.navigate(['/country', country]);
  }

  onSearchChange(event: any): void {
    this.searchText = event.target.value.toLowerCase();
    this.filteredCountries = this.countries.filter((country: any) =>
      country.properties.name.toLowerCase().includes(this.searchText)
    );
    this.drawMap(this.filteredCountries, geoPath().projection(geoMercator().scale(180).translate([this.width / 2, this.height / 1.40])));
  }
}
