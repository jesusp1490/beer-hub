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
        const slidesToShow = this.beers.length < 5 ? this.beers.length : 5; // Mostrar el número de cervezas disponibles, hasta un máximo de 5
        const slidesToScroll = this.beers.length < 3 ? 1 : 3; // Desplazar 1 si hay menos de 3 cervezas

        $carouselTrack.slick({
          infinite: this.beers.length > 1, // Desactivar infinite si solo hay 1 cerveza
          slidesToShow: slidesToShow,
          slidesToScroll: slidesToScroll,
          centerMode: this.beers.length > 1, // Solo centrar si hay más de 1 cerveza
          centerPadding: '0px',
          dots: this.beers.length > 1, // Desactivar puntos de navegación si solo hay 1 cerveza
          prevArrow: '.carousel-button.left',
          nextArrow: '.carousel-button.right',
          responsive: [
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: Math.min(slidesToShow, 3), // Ajustar según el tamaño de pantalla
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
