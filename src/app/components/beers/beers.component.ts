import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Location } from '@angular/common';
import { Beer } from './beers.interface';
import { Brand } from '../country/brand.interface';
// import * as $ from 'jquery';
// import 'slick-carousel';

@Component({
  selector: 'app-beers',
  templateUrl: './beers.component.html',
  styleUrls: ['./beers.component.scss']
})
export class BeersComponent implements OnInit, AfterViewInit {
  brandName: string = '';
  beers: Beer[] = [];
  visibleBeers: Beer[] = [];
  page: number = 0;
  pageSize: number = 5; 
  private countryId: string = '';
  private brandId: string = '';

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.countryId = params.get('country') || '';
      this.brandId = params.get('brandId') || '';
      this.loadBrandData(this.brandId);
      this.loadBeers(this.countryId, this.brandId);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeSlick();
    }, 200); // Ensure the content is available
  }

  private initializeSlick(): void {
    const $carouselTrack = $('.carousel-track');

    if ($carouselTrack.length && !$carouselTrack.hasClass('slick-initialized')) {
      setTimeout(() => {
        const slidesToShow = this.beers.length < 5 ? this.beers.length : 5;
        const slidesToScroll = this.beers.length < 3 ? 1 : 3;

        $carouselTrack.slick({
          infinite: true,
          slidesToShow: slidesToShow,
          slidesToScroll: slidesToScroll,
          centerMode: true,
          centerPadding: '0px',
          dots: true,
          prevArrow: '.carousel-button.left',
          nextArrow: '.carousel-button.right',
          responsive: [
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: Math.min(slidesToShow, 3),
                slidesToScroll: Math.min(slidesToScroll, 1)
              }
            },
            {
              breakpoint: 600,
              settings: {
                slidesToShow: Math.min(slidesToShow, 2),
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
      }, 200);
    }
  }

  goBack(): void {
    this.location.back(); // Navigate to the previous page
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
          this.updateVisibleBeers();
        },
        error => {
          console.error('Error loading beers:', error);
        }
      );
  }

  private updateVisibleBeers(): void {
    const start = this.page * this.pageSize;
    const end = start + this.pageSize;
    this.visibleBeers = this.beers.slice(start, end);
  }

  selectBeer(beerId: string): void {
    console.log('Selecting beer with ID:', beerId); // Verify the ID is correct
    const route = `/country/${this.countryId}/brands/${this.brandId}/beers/${beerId}`;
    this.router.navigate([route]);
  }
}
