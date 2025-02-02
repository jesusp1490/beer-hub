import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { Location } from "@angular/common"
import { FormBuilder, FormGroup } from "@angular/forms"
import { Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"
import Swiper from "swiper"
import { Navigation, Pagination } from "swiper/modules"

import { Beer } from "./beers.interface"
import { Brand } from "../country/brand.interface"

@Component({
  selector: "app-beers",
  templateUrl: "./beers.component.html",
  styleUrls: ["./beers.component.scss"],
})
export class BeersComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("swiperContainer") swiperContainer?: ElementRef

  brandName = ""
  beers: Beer[] = []
  brandId = ""
  filtersForm: FormGroup
  private unsubscribe$ = new Subject<void>()
  isLoading = true
  swiper: Swiper | null = null

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
  ) {
    this.filtersForm = this.fb.group({
      searchTerm: [""],
      beerType: [""],
      abvRange: [10],
      ingredient: [""],
    })
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
      this.brandId = params.get("brandId") ?? ""
      if (this.brandId) {
        this.loadBrandData(this.brandId)
        this.loadBeers(this.brandId)
      } else {
        console.error("Invalid brandId")
        this.router.navigate(["/home"])
      }
    })
  }

  ngAfterViewInit(): void {
    this.initSwiper()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
    if (this.swiper) {
      this.swiper.destroy()
    }
  }

  private loadBrandData(brandId: string): void {
    this.firestore
      .collection<Brand>("brands")
      .doc(brandId)
      .valueChanges()
      .subscribe(
        (brand) => {
          if (brand) {
            this.brandName = brand.name
          } else {
            console.error("Brand not found")
          }
        },
        (error) => {
          console.error("Error loading brand data:", error)
        },
      )
  }

  private loadBeers(brandId: string): void {
    this.isLoading = true
    this.firestore
      .collection<Beer>("beers", (ref) => ref.where("brandId", "==", brandId))
      .valueChanges({ idField: "id" })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (beers) => {
          this.beers = beers
          this.isLoading = false
          setTimeout(() => {
            this.initSwiper()
          }, 0)
        },
        (error) => {
          console.error("Error loading beers:", error)
          this.isLoading = false
        },
      )
  }

  private initSwiper(): void {
    if (this.swiperContainer && this.swiperContainer.nativeElement) {
      if (this.swiper) {
        this.swiper.destroy()
      }
      this.swiper = new Swiper(this.swiperContainer.nativeElement, {
        modules: [Navigation, Pagination],
        slidesPerView: 1,
        spaceBetween: 30,
        centeredSlides: true,
        loop: true,
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        breakpoints: {
          640: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
        },
      })
    }
  }

  selectBeer(beerId: string): void {
    this.router.navigate(["/beer", beerId])
  }

  goBack(): void {
    this.location.back()
  }
}
