import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Beer } from './beers.interface';
import { Brand } from '../country/brand.interface';

@Component({
  selector: 'app-beers',
  templateUrl: './beers.component.html',
  styleUrls: ['./beers.component.scss']
})
export class BeersComponent implements OnInit {
  brandName: string = '';
  beers: Beer[] = [];
  visibleBeers: Beer[] = [];
  page: number = 0;
  pageSize: number = 5; // Número de cervezas por página
  private countryId: string = '';
  private brandId: string = '';

  // Configuración para Slick Slider
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
          centerPadding: '0px', // Ajusta según sea necesario
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
      }, 200);
    }
  }

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.countryId = params.get('country') || '';
      this.brandId = params.get('brandId') || '';
      this.loadBrandData(this.brandId);
      this.loadBeers(this.countryId, this.brandId);
    });
  }

  private loadBrandData(brandId: string): void {
    this.firestore.collection<Brand>('brands').doc(brandId).valueChanges().subscribe(brand => {
      if (brand) {
        this.brandName = brand.name;
      } else {
        console.error('Brand not found');
      }
    });
  }

  private loadBeers(countryId: string, brandId: string): void {
    this.firestore.collection<Beer>('beers', ref => ref
      .where('countryId', '==', countryId)
      .where('brandId', '==', brandId))
      .valueChanges()
      .subscribe(beers => {
        this.beers = beers;
        this.updateVisibleBeers();
      });
  }

  private updateVisibleBeers(): void {
    const start = this.page * this.pageSize;
    const end = start + this.pageSize;
    this.visibleBeers = this.beers.slice(start, end);
  }

  selectBeer(beerId: string): void {
    console.log('Selecting beer with ID:', beerId); // Verifica que el ID es correcto
    const route = `/country/${this.countryId}/brands/${this.brandId}/beers/${beerId}`;
    this.router.navigate([route]);
  }
}
