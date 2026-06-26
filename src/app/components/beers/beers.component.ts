import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"
import { AngularFirestore } from "@angular/fire/compat/firestore"
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
  @ViewChild("brandWatermark") brandWatermark?: ElementRef<HTMLHeadingElement>

  brandName = ""
  beers: Beer[] = []
  brandId = ""
  private unsubscribe$ = new Subject<void>()
  isLoading = true
  swiper: Swiper | null = null

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router,
  ) {}

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
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (brand) => {
          if (brand) {
            this.brandName = brand.name
            setTimeout(() => this.fitWatermark(), 0)
          } else {
            console.error("Brand not found")
          }
        },
        error: (error) => {
          console.error("Error loading brand data:", error)
        },
      })
  }

  private loadBeers(brandId: string): void {
    this.isLoading = true
    this.firestore
      .collection<Beer>("beers", (ref) => ref.where("brandId", "==", brandId))
      .valueChanges({ idField: "id" })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (beers) => {
          this.beers = beers
          this.isLoading = false
          setTimeout(() => {
            this.initSwiper()
          }, 0)
        },
        error: (error) => {
          console.error("Error loading beers:", error)
          this.isLoading = false
        },
      })
  }

  private initSwiper(): void {
    if (this.swiperContainer && this.swiperContainer.nativeElement) {
      if (this.swiper) {
        this.swiper.destroy()
      }

      const totalSlides = this.beers.length
      const slidesPerView = Math.min(5, totalSlides)

      this.swiper = new Swiper(this.swiperContainer.nativeElement, {
        modules: [Navigation, Pagination],
        slidesPerView: slidesPerView,
        spaceBetween: 80,
        loop: false,
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        on: {
          init: (swiper: Swiper) => {
            this.updateSlideStyles(swiper)
          },
          slideChange: (swiper: Swiper) => {
            this.updateSlideStyles(swiper)
          },
        },
      })
    }
  }

  private updateSlideStyles(swiper: Swiper): void {
    const slides = swiper.slides
    const activeIndex = swiper.activeIndex
    const totalSlides = slides.length
    const visibleSlides = Math.min(5, totalSlides)

    slides.forEach((slide: HTMLElement, index: number) => {
      slide.classList.remove("swiper-slide-visible", "swiper-slide-active", "swiper-slide-prev", "swiper-slide-next")

      let relativeIndex = (index - activeIndex + totalSlides) % totalSlides
      if (relativeIndex < 0) relativeIndex += totalSlides
      if (relativeIndex >= 0 && relativeIndex < visibleSlides) {
        slide.classList.add("swiper-slide-visible")
        if (relativeIndex === Math.floor(visibleSlides / 2)) {
          slide.classList.add("swiper-slide-active")
        } else if (relativeIndex === Math.floor(visibleSlides / 2) - 1) {
          slide.classList.add("swiper-slide-prev")
        } else if (relativeIndex === Math.floor(visibleSlides / 2) + 1) {
          slide.classList.add("swiper-slide-next")
        }
      }
    })
  }

  selectBeer(beerId: string): void {
    this.router.navigate(["/beer", beerId])
  }

  private fitWatermark(): void {
    const el = this.brandWatermark?.nativeElement
    if (!el) return

    const container = el.parentElement
    if (!container) return

    const maxFontSize = 14
    el.style.fontSize = `${maxFontSize}rem`

    const availableWidth = container.clientWidth * 0.92
    const textWidth = el.scrollWidth

    if (textWidth > 0 && availableWidth > 0) {
      const scale = Math.min(1, availableWidth / textWidth)
      const newSize = Math.max(2, maxFontSize * scale)
      el.style.fontSize = `${newSize}rem`
    }
  }
}
