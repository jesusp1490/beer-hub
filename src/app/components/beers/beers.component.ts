import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Location } from '@angular/common';
import { Beer } from './beers.interface';
import { Brand } from '../country/brand.interface';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

declare var $: any;

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
  isLoading: boolean = true;

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
      this.brandId = params.get('brandId') ?? '';

      if (this.brandId) {
        this.loadBrandData(this.brandId);
        this.loadBeers(this.brandId);
      } else {
        console.error('Invalid brandId');
        this.router.navigate(['/home']);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit(): void {
    
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

  private loadBeers(brandId: string): void {
    this.isLoading = true;
    this.firestore.collection<Beer>('beers', ref => ref.where('brandId', '==', brandId))
      .valueChanges()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        beers => {
          this.beers = beers;
          this.applyFilters();
          this.preloadImages();
        },
        error => {
          console.error('Error loading beers:', error);
          this.isLoading = false;
        }
      );
  }

  private preloadImages(): void {
    const imageLoadPromises = this.beers.map(beer => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = beer.beerImageUrl;
      });
    });

    forkJoin(imageLoadPromises).subscribe(() => {
      this.isLoading = false;
      setTimeout(() => {
        this.initializeSlick();
      }, 0);
    });
  }

  private initializeSlick(): void {
    const $carouselTrack = $('.carousel-track');

    if ($carouselTrack.length && !$carouselTrack.hasClass('slick-initialized')) {
      const totalBeers = this.beers.length;
      const slidesToShow = totalBeers < 5 ? totalBeers : 5;
      const centerMode = totalBeers >= 3;

      $carouselTrack.slick({
        infinite: true,
        slidesToShow: slidesToShow,
        slidesToScroll: 1,
        centerMode: centerMode,
        centerPadding: '0px',
        dots: true,
        prevArrow: '.carousel-button.left',
        nextArrow: '.carousel-button.right',
        speed: 500,
        cssEase: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        responsive: [
          {
            breakpoint: 1920,
            settings: {
              slidesToShow: slidesToShow,
              slidesToScroll: 1,
              
            }
          },
          {
            breakpoint: 1400,
            settings: {
              slidesToShow: slidesToShow,
              slidesToScroll: 1,
              
            }
          },
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: totalBeers < 3 ? totalBeers : 3,
              slidesToScroll: 1,
            }
          },
          {
            breakpoint: 992,
            settings: {
              slidesToShow: totalBeers < 3 ? totalBeers : 3,
              slidesToScroll: 1,
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              centerMode: true,
              centerPadding: '60px',
            }
          },
          {
            breakpoint: 576,
            settings: {
              slidesToShow: 1,
              centerMode: true,
              centerPadding: '40px',
            }
          }
        ]
      });
    }
  }

  applyFilters() {
    this.filteredBeers = this.beers.filter(beer => {
      return true; 
    });
    this.updateVisibleBeers();
  }

  private updateVisibleBeers() {
    const start = this.page * this.pageSize;
    const end = start + this.pageSize;
    this.visibleBeers = this.filteredBeers.slice(start, end);
  }

  selectBeer(beerId: string): void {
  this.router.navigate(['/beer', beerId]);
}

  goBack(): void {
    this.location.back();
  }
}