import { Component, OnInit, ElementRef, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import { Router } from '@angular/router';
import { BeerService } from '../../services/beer.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private width!: number;
  private height!: number;
  private countries: any[] = []; 
  private filteredCountries: any[] = []; 
  private searchText: string = '';
  private zoom: d3.ZoomBehavior<Element, unknown>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
  private colorScale!: d3.ScaleLinear<string, string>;
  private countryBeerCounts: { [countryId: string]: number } = {};
  private destroy$ = new Subject<void>();
  
  public isHeatMap: boolean = false;
  private heatMapColorScale!: d3.ScaleLinear<string, string>;
  private isMobile: boolean = false;

  constructor(
    private el: ElementRef,
    private router: Router,
    private beerService: BeerService
  ) {
    this.zoom = d3.zoom()
      .scaleExtent([1, 3])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.setDimensions();
    this.createSvg();
    this.createTooltip();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
    this.setDimensions();
    this.updateSvg();
    this.updateProjection();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private setDimensions(): void {
    const element = this.el.nativeElement.querySelector('.map-container');
    this.width = element.clientWidth;
    this.height = this.isMobile ? window.innerHeight * 0.6 : element.clientHeight;
  }

  private createSvg(): void {
    const container = d3.select(this.el.nativeElement).select('.map-container');
    container.selectAll('svg').remove();

    this.svg = container.append('svg')
      .attr('class', 'map-svg')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    this.g = this.svg.append('g');

    this.svg.call(this.zoom as any);
  }

  private updateSvg(): void {
    this.svg
      .attr('viewBox', `0 0 ${this.width} ${this.height}`);
  }

  private createTooltip(): void {
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', '#333333')
      .style('padding', '10px')
      .style('border-radius', '5px')
      .style('pointer-events', 'none');
  }

  private createProjection(): d3.GeoProjection {
    const scale = this.isMobile ? (this.width / 6.4) * 0.7 : (this.width / 6.4) * 0.9;
    return geoMercator()
      .scale(scale)
      .translate([this.width / 2, this.height / 1.5]);
  }

  private updateProjection(): void {
    const projection = this.createProjection();
    const path = geoPath().projection(projection);
    this.drawMap(this.filteredCountries, path);
  }

  private loadData(): void {
    const projection = this.createProjection();
    const path = geoPath().projection(projection);

    this.beerService.getCountryBeerCounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        beerCounts => {
          this.countryBeerCounts = beerCounts;
          this.updateColorScale();

          d3.json('assets/custom110m.geo.json').then((data: any) => {
            if (!data) {
              console.error('No map data loaded');
              return;
            }

            this.countries = data.features; 
            this.filteredCountries = this.countries; 
            this.drawMap(this.filteredCountries, path);
          }).catch(error => {
            console.error('Error loading GeoJSON:', error);
          });
        },
        error => {
          console.error('Error loading beer counts:', error);
        }
      );
  }

  private updateColorScale(): void {
    const beerCounts = Object.values(this.countryBeerCounts);
    const maxCount = Math.max(...beerCounts, 1);
    const minCount = Math.min(...beerCounts, 0);

    this.colorScale = d3.scaleLinear<string>()
      .domain([minCount, maxCount])
      .range(['#c7c7c7', '#606060'])
      .interpolate(d3.interpolateRgb.gamma(2.2));

    this.heatMapColorScale = d3.scaleLinear<string>()
      .domain([minCount, maxCount])
      .range(['#FEE5D9', '#A50F15'])
      .interpolate(d3.interpolateRgb.gamma(2.2));
  }

  private drawMap(countries: any[], path: any): void {
    this.g.selectAll('path').remove(); 

    this.g.selectAll('path')
      .data(countries)
      .enter()
      .append('path')
      .attr('d', (d: any) => path(d) as string)
      .attr('fill', (d: any) => this.getCountryColor(d))
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 0.5)
      .on('mouseover', (event: any, d: any) => this.onMouseOver(event, d))
      .on('mouseout', (event: any, d: any) => this.onMouseOut(event, d))
      .on('click', (event: any, d: any) => this.onCountrySelect(event, d));
  }

  private getCountryColor(d: any): string {
    const countryName = d.properties.name;
    const beerCount = this.countryBeerCounts[countryName] || 0;
    return this.isHeatMap ? this.heatMapColorScale(beerCount) : this.colorScale(beerCount);
  }

  private updateTooltipPosition(event: any): void {
    const tooltipWidth = 150; // Approximate width of the tooltip
    const tooltipHeight = 60; // Approximate height of the tooltip
    
    let left = event.pageX + 10;
    let top = event.pageY - 28;

    // Adjust position if tooltip would go off the right edge of the screen
    if (left + tooltipWidth > window.innerWidth) {
      left = event.pageX - tooltipWidth - 10;
    }

    // Adjust position if tooltip would go off the bottom of the screen
    if (top + tooltipHeight > window.innerHeight) {
      top = event.pageY - tooltipHeight - 10;
    }

    this.tooltip
      .style('left', `${left}px`)
      .style('top', `${top}px`);
  }

  private onMouseOver(event: any, d: any): void {
    const countryName = d.properties.name;
    const beerCount = this.countryBeerCounts[countryName] || 0;

    d3.select(event.currentTarget)
      .transition()
      .duration(50)
      .attr('fill', '#ff9100')
      .attr('filter', 'drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.5))');

    this.tooltip.transition()
      .duration(200)
      .style('opacity', .9);
    this.tooltip.html(`${countryName}<br>Beers: ${beerCount}`);
    this.updateTooltipPosition(event);
  }

  private onMouseOut(event: any, d: any): void {
    d3.select(event.currentTarget)
      .transition()
      .duration(100)
      .attr('fill', this.getCountryColor(d))
      .attr('filter', 'none');

    this.tooltip.transition()
      .duration(500)
      .style('opacity', 0);
  }

  private onCountrySelect(event: any, d: any): void {
    this.tooltip.style('opacity', 0);

    d3.select(event.currentTarget)
      .attr('fill', this.getCountryColor(d))
      .attr('filter', 'none');

    const countryName = d.properties.name;
    this.router.navigate(['/country', countryName]);
  }

  onSearchChange(event: any): void {
    this.searchText = event.target.value.toLowerCase();
    this.filteredCountries = this.countries.filter((country: any) =>
      country.properties.name.toLowerCase().includes(this.searchText)
    );
    this.updateProjection();
  }

  resetZoom(): void {
    this.svg.transition().duration(750).call(
      this.zoom.transform as any,
      d3.zoomIdentity,
      d3.zoomTransform(this.svg.node() as any).invert([this.width / 2, this.height / 2])
    );
  }

  toggleHeatMap(): void {
    this.isHeatMap = !this.isHeatMap;
    this.updateMap();
  }

  private updateMap(): void {
    this.g.selectAll('path')
      .transition()
      .duration(750)
      .attr('fill', (d: any) => this.getCountryColor(d));
    
    this.updateLegend();
  }

  private updateLegend(): void {
    const beerCounts = Object.values(this.countryBeerCounts);
    const maxCount = Math.max(...beerCounts, 1);
    const minCount = Math.min(...beerCounts, 0);

    const legendScale = this.isHeatMap ? this.heatMapColorScale : this.colorScale;

    const legendGradient = this.svg.select('.legend-gradient');
    if (legendGradient.empty()) {
      this.svg.append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%')
        .selectAll('stop')
        .data(legendScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: legendScale(t) })))
        .enter().append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);
    } else {
      legendGradient.selectAll('stop')
        .data(legendScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: legendScale(t) })))
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);
    }

    d3.select('.legend-gradient')
      .style('background', 'linear-gradient(to right, ' + legendScale.range().join(',') + ')');

    d3.select('.legend-labels')
      .html(`<span>${minCount}</span><span>${maxCount}</span>`);
  }

  zoomToRegion(region: string): void {
    let bounds: [[number, number], [number, number]];
    switch (region) {
      case 'Europe':
        bounds = [[-20, -10], [70, 75]];
        break;
      case 'North America':
        bounds = [[-170, -20], [-40, 75]];
        break;
      case 'Asia':
        bounds = [[20, 0], [180, 60]];
        break;
      default:
        return;
    }

    const [[x0, y0], [x1, y1]] = bounds;
    const projection = this.createProjection();
    const projectedPoints = [projection([x0, y0]), projection([x1, y1])];

    if (projectedPoints[0] && projectedPoints[1]) {
      const [[px0, py0], [px1, py1]] = projectedPoints as [[number, number], [number, number]];
      const scale = Math.min(8, 0.9 / Math.max((px1 - px0) / this.width, (py1 - py0) / this.height));
      const translate = [this.width / 2 - scale * (px0 + px1) / 2, this.height / 2 - scale * (py0 + py1) / 2];

      this.svg.transition().duration(750).call(
        this.zoom.transform as any,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
    }
  }

  onLegendHover(event: MouseEvent): void {
    const legendElement = event.currentTarget as HTMLElement;
    const rect = legendElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    
    const beerCounts = Object.values(this.countryBeerCounts);
    const maxCount = Math.max(...beerCounts, 1);
    const minCount = Math.min(...beerCounts, 0);
    const hoverValue = minCount + percentage * (maxCount - minCount);

    this.g.selectAll('path')
      .attr('opacity', (d: any) => {
        const countryName = d.properties.name;
        const beerCount = this.countryBeerCounts[countryName] || 0;
        return Math.abs(beerCount - hoverValue) < (maxCount - minCount) * 0.1 ? 1 : 0.3;
      });
  }

  onLegendLeave(): void {
    this.g.selectAll('path')
      .attr('opacity', 1);
  }

  simulateDataChange(): void {
    Object.keys(this.countryBeerCounts).forEach(country => {
      this.countryBeerCounts[country] = Math.floor(Math.random() * 1000);
    });
    this.updateColorScale();
    this.animateDataChange();
  }

  private animateDataChange(): void {
    this.g.selectAll('path')
      .transition()
      .duration(1000)
      .attr('fill', (d: any) => this.getCountryColor(d));
    
    this.updateLegend();
  }
}