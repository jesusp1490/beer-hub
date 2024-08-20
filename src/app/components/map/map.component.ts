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
  private width = 1000;
  private height = 800;

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    this.createSvg();
    this.drawMap();
  }

  private createSvg(): void {
    this.svg = d3.select(this.el.nativeElement)
      .select('.map-container')
      .append('svg')
      .attr('width', '100%')  // Make responsive
      .attr('height', '90%') // Make responsive
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet'); // Maintain aspect ratio
  }

  private drawMap(): void {
    const projection = geoMercator()
      .scale(180)
      .translate([this.width / 2, this.height / 1.40]);

    const path = geoPath().projection(projection);

    d3.json('assets/custom110m.geo.json').then((data: any) => {
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
        .attr('fill', '#BDC3C7')
        .attr('stroke', '#747474')
        .attr('stroke-width', 1)
        .on('mouseover', function (event: any, d: any) {
          d3.select(this)
            .transition()
            .duration(100)
            .attr('fill', '#8A8A8A')  // Hover color
            .attr('filter', 'drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.5))');
        })
        .on('mouseout', function (event: any, d: any) {
          d3.select(this)
            .transition()
            .duration(100)
            .attr('fill', '#BDC3C7')  // Original color
            .attr('filter', 'none');
        })
        .on('click', (event: any, d: any) => {
          this.onCountrySelect(d.properties.name);
        });
    });
  }

  private onCountrySelect(country: string): void {
    console.log('Country selected:', country);
    // Navegar a la página de cervezas del país seleccionado o realizar otra acción
  }
}
