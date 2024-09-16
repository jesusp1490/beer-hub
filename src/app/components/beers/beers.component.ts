import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Location } from '@angular/common';
import { Beer } from './beers.interface';
import { Brand } from '../country/brand.interface';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as $ from 'jquery';

@Component({
  selector: 'app-beers',
  templateUrl: './beers.component.html',
  styleUrls: ['./beers.component.scss']
})
export class BeersComponent implements OnInit, AfterViewInit {
  brandName: string = '';
  beers: Beer[] = [];
  filteredBeers: Beer[] = [];
  visibleBeers: Beer[] = [];
  page: number = 0;
  pageSize: number = 5;
  countryId: string = '';
  brandId: string = '';
  filtersForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
  ) {
    this.filtersForm = this.fb.group({
      searchTerm: [''],
      beerType: [''],
      abvRange: [10],
      ingredient: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.countryId = params.get('country') ?? '';
      this.brandId = params.get('brandId') ?? '';

      console.log('Country ID in BeersComponent:', this.countryId);
      console.log('Brand ID in BeersComponent:', this.brandId);

      if (this.countryId && this.brandId) {
        this.loadBrandData(this.brandId);
        this.loadBeers(this.countryId, this.brandId);
      } else {
        console.error('Invalid countryId or brandId');
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeSlick();
    }, 200);
  }

  private initializeSlick(): void {
    const $carouselTrack = $('.carousel-track');

    if ($carouselTrack.length && !$carouselTrack.hasClass('slick-initialized')) {
      setTimeout(() => {
        const totalBeers = this.beers.length;
        const slidesToShow = Math.min(totalBeers, 5); // Mostrar máximo 5 cervezas

        $carouselTrack.slick({
          infinite: true,
          slidesToShow: slidesToShow,
          slidesToScroll: 1,
          centerMode: true,
          centerPadding: '0px',
          dots: true,
          prevArrow: '.carousel-button.left',
          nextArrow: '.carousel-button.right',
          responsive: [
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: slidesToShow,
                slidesToScroll: 1,
              }
            },
            {
              breakpoint: 600,
              settings: {
                slidesToShow: Math.min(2, totalBeers),
                slidesToScroll: 1
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow: Math.min(1, totalBeers),
                slidesToScroll: 1
              }
            }
          ]
        });
      }, 200);
    }
  }


  goBack(): void {
    this.location.back();
  }

  private loadBrandData(brandId: string): void {
    this.firestore.collection<Brand>('brands').doc(brandId).valueChanges().subscribe(
      brand => {
        if (brand) {
          this.brandName = brand.name;
        } else {
          console.error('Brand not found');
        }
      },
      error => {
        console.error('Error loading brand data:', error);
      }
    );
  }

  private loadBeers(countryId: string, brandId: string): void {
    this.firestore.collection<Beer>('beers', ref => ref
      .where('countryId', '==', countryId)
      .where('brandId', '==', brandId))
      .valueChanges()
      .subscribe(
        beers => {
          this.beers = beers;
          this.applyFilters();
        },
        error => {
          console.error('Error loading beers:', error);
        }
      );
  }

  private applyFilters(): void {
    const { searchTerm, beerType, abvRange, ingredient } = this.filtersForm.value;

    this.filteredBeers = this.beers.filter(beer => {
      const matchesSearchTerm = searchTerm ? beer.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchesBeerType = beerType ? beer.beerType === beerType : true;
      const matchesAbv = abvRange ? beer.ABV <= abvRange : true;
      const matchesIngredient = ingredient ? (beer.ingredients ?? []).some(ing => ing.name.toLowerCase().includes(ingredient.toLowerCase())) : true;

      return matchesSearchTerm && matchesBeerType && matchesAbv && matchesIngredient;
    });

    this.updateVisibleBeers();
  }

  private updateVisibleBeers(): void {
    const start = this.page * this.pageSize;
    const end = start + this.pageSize;
    this.visibleBeers = this.filteredBeers.slice(start, end);
  }

  selectBeer(beerId: string): void {
    console.log('Selecting beer with ID:', beerId);
    const route = `/country/${this.countryId}/brands/${this.brandId}/beers/${beerId}`;
    this.router.navigate([route]);
  }

  viewBrandBeers(brandId: string): void {
    console.log('Viewing beers for brand ID:', brandId);
    const route = `/country/${this.countryId}/brands/${brandId}/beers`;
    this.router.navigate([route]);
  }

  onSearchResults(searchResults: Beer[]): void {
    this.beers = searchResults;
    this.applyFilters();
  }

  previousSlide(): void {
    $('.carousel-track').slick('slickPrev');
  }

  nextSlide(): void {
    $('.carousel-track').slick('slickNext');
  }
}
