import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

interface CountryFeature {
  type: string;
  properties: {
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private svg: any;
  private width: number = 800;
  private height: number = 600;

  constructor() { }

  ngOnInit(): void {
    this.createMap();
  }

  private createMap(): void {
    if (!this.mapContainer) {
      console.error('mapContainer no está definido');
      return;
    }

    this.svg = d3.select(this.mapContainer.nativeElement)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    const projection = d3.geoMercator()
      .scale(150)
      .translate([this.width / 2, this.height / 2]);

    const path = d3.geoPath().projection(projection);

    d3.json('assets/world-110m.json').then((data: any) => {
      const countries: CountryFeature[] = feature(data, data.objects.countries).features as CountryFeature[];

      if (!countries || countries.length === 0) {
        console.error('No se encontraron datos de países en el archivo JSON');
        return;
      }

      this.svg.append('g')
        .selectAll('path')
        .data(countries)
        .enter()
        .append('path')
        .attr('d', (d: CountryFeature) => path(d as any)) // Usamos 'as any' para evitar problemas de tipos
        .attr('fill', '#ccc')
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5)
        .on('mouseover', (event: MouseEvent, d: CountryFeature) => {
          const target = event.currentTarget as SVGElement;
          if (target) {
            d3.select(target).attr('fill', '#aaa');
          }
        })
        .on('mouseout', (event: MouseEvent, d: CountryFeature) => {
          const target = event.currentTarget as SVGElement;
          if (target) {
            d3.select(target).attr('fill', '#ccc');
          }
        });
    }).catch(error => {
      console.error('Error al cargar el archivo JSON:', error);
    });
  }
}
