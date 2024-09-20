import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Location } from '@angular/common';
import { Beer } from './beers.interface';
import { Brand } from '../country/brand.interface';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-beers',
  templateUrl: './beers.component.html',
  styleUrls: ['./beers.component.scss']
})
export class BeersComponent implements OnInit, AfterViewInit, OnDestroy {
  brandName: string = '';
  beers: Beer[] = [];
  filteredBeers: Beer[] = [];
  visibleBeers: Beer[] = [];
  page: number = 0;
  pageSize: number = 5;
  countryId: string = '';
  brandId: string = '';
  filtersForm: FormGroup;
  private unsubscribe$ = new Subject<void>();

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
    this.route.paramMap.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.countryId = params.get('country') ?? '';
      this.brandId = params.get('brandId') ?? '';

      if (this.brandId) {
        this.loadBrandData(this.brandId);
        this.loadBeers(this.brandId);
      } else {
        console.error('Invalid brandId');
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeSlick();
    }, 200);
  }

  private loadBeers(brandId: string): void {
    this.firestore.collection<Beer>('beers', ref => ref.where('brandId', '==', brandId))
      .valueChanges()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        beers => {
          this.beers = beers;
          this.applyFilters();
          // Initialize Slick after beers are loaded
          setTimeout(() => {
            this.initializeSlick();
          }, 0);
        },
        error => {
          console.error('Error loading beers:', error);
        }
      );
  }

  private initializeSlick(): void {
    const $carouselTrack = $('.carousel-track');

    if ($carouselTrack.length && !$carouselTrack.hasClass('slick-initialized')) {
      const totalBeers = this.beers.length;
      const slidesToShow = Math.min(totalBeers, 5);

      $carouselTrack.slick({
        infinite: true,
        slidesToShow: slidesToShow,
        slidesToScroll: 1,
        centerMode: true,
        centerPadding: '0px',
        dots: true,
        prevArrow: '.carousel-button.left',
        nextArrow: '.carousel-button.right',
        speed: 500,
        cssEase: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        responsive: [
          {
            breakpoint: 1024,
            settings: {
              slidesToShow: Math.min(3, totalBeers),
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
              slidesToShow: 1,
              slidesToScroll: 1
            }
          }
        ]
      });
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
  
  applyFilters() {
    // Implement your filter logic here
    this.filteredBeers = this.beers.filter(beer => {
      // Add your filtering conditions
      return true; // Replace with actual filtering logic
    });
  }

  selectBeer(beerId: string): void {
    this.router.navigate(['/beers', beerId]);
  }
}

function applyFilters() {
  throw new Error('Function not implemented.');
}
