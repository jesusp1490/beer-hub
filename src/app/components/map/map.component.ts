import { Component, OnInit, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { geoMercator, geoPath } from 'd3-geo';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width = 960;
  private height = 600;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.createSvg();
    this.drawMap();
  }

  private createSvg(): void {
    this.svg = d3.select(this.el.nativeElement)
      .select('.map-container')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
  }

  private drawMap(): void {
    const projection = geoMercator()
      .scale(150)
      .translate([this.width / 2, this.height / 1.5]);

    const path = geoPath().projection(projection);

    d3.json('assets/world.geojson').then((data: any) => {
      if (!data) {
        console.error('No data loaded');
        return;
      }
      console.log('Data loaded', data);

      this.svg.selectAll('path')
        .data(data.features)
        .enter()
        .append('path')
        .attr('d', (d: any) => path(d) as string)
        .attr('fill', '#cccccc')
        .attr('stroke', '#333333')
        .attr('stroke-width', 0.5)
        .on('click', (event: any, d: any) => {
          this.onCountrySelect(d.properties.name);
        });
    }).catch((error: any) => {
      console.error('Error loading GeoJSON data', error);
    });
  }

  private onCountrySelect(country: string): void {
    console.log('Country selected:', country);
    // Aquí puedes navegar a la página de cervezas del país seleccionado
  }
}
