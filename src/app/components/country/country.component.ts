import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Country } from './country.interface';
import { Brand } from './brand.interface';
import { SlickCarouselComponent } from 'ngx-slick-carousel';
import * as $ from 'jquery';
import 'slick-carousel';

@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss']
})
export class CountryComponent implements OnInit, AfterViewInit {
  country$: Observable<Country | undefined>;
  countryName: string = '';
  countryFlagUrl: string = '';
  brands: Brand[] = [];
  private countryId: string = '';
  page: number = 0;
  pageSize: number = 10;
  visibleBrands: Brand[] = [];



  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.countryId = this.route.snapshot.paramMap.get('country') || '';
    this.country$ = this.firestore.doc<Country>(`countries/${this.countryId}`).valueChanges();
  }

  ngOnInit(): void {
    this.loadCountryData(this.countryId);
  }

  private loadCountryData(countryId: string): void {
    this.firestore.doc<Country>(`countries/${countryId}`).valueChanges().subscribe(country => {
      if (country) {
        this.countryName = country.name;
        this.countryFlagUrl = country.flagUrl;
        this.loadBrands(countryId);
      } else {
        console.error('Country not found');
      }
    });
  }

  private loadBrands(countryId: string): void {
    this.firestore.collection<Brand>('brands', ref => ref.where('countryId', '==', countryId))
      .valueChanges()
      .subscribe(brands => {
        this.brands = brands;
        this.updateVisibleBrands();
        console.log('Visible brands:', this.visibleBrands);
        if (this.brands.length > 0) {
          this.cdr.detectChanges(); // Forzar detección de cambios
        } else {
          console.error('No brands found');
        }
      });
  }

  updateVisibleBrands(): void {
    this.visibleBrands = this.brands.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize);
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.updateVisibleBrands();
    }
  }

  nextPage(): void {
    if ((this.page + 1) * this.pageSize < this.brands.length) {
      this.page++;
      this.updateVisibleBrands();
    }
  }

  selectBrand(brandId: string): void {
    const route = `/country/${this.countryId}/brands/${brandId}/beers`;
    console.log('Navigating to:', route);
    this.router.navigate([route]);
  }

  get hasMoreBrands(): boolean {
    return (this.page + 1) * this.pageSize < this.brands.length;
  }

  getRows(): Brand[][] {
    const rows: Brand[][] = [];
    for (let i = 0; i < this.visibleBrands.length; i += 5) {
      rows.push(this.visibleBrands.slice(i, i + 5));
    }
    return rows;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeSlick();
    }, 100); // Asegúrate de que el contenido esté disponible
  }


  private initializeSlick(): void {
    const $carouselTrack = $('.carousel-track');

    if ($carouselTrack.length && !$carouselTrack.hasClass('slick-initialized')) {
      setTimeout(() => {
        $carouselTrack.slick({
          infinite: true,
          slidesToShow: 5,
          slidesToScroll: 3,
          centerMode: true,
          centerPadding: '10px', // Ajusta según sea necesario
          dots: true, // Habilita los puntos de navegación,
          prevArrow: '.carousel-button.left',
          nextArrow: '.carousel-button.right',
          responsive: [
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 3,
                slidesToScroll: 1
              }
            },
            {
              breakpoint: 600,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 1
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1
              }
            }
          ]
        });
      }, 100);
    }
  }
}