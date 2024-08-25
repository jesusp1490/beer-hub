import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
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
  page: number = 0;
  pageSize: number = 6; // Número de cervezas por página
  loading: boolean = false;
  totalBeers: number = 0;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const countryId = params.get('country');
      const brandId = params.get('brandId');
      console.log('Country ID:', countryId);
      console.log('Brand ID:', brandId);

      if (countryId && brandId) {
        this.loadBrandData(brandId);
        this.loadBeers(countryId, brandId);
      }
    });
  }

  private loadBrandData(brandId: string): void {
    this.firestore.collection<Brand>('brands').doc(brandId).valueChanges().subscribe(brand => {
      if (brand) {
        this.brandName = brand.name;
      }
    });
  }

  private loadBeers(countryId: string, brandId: string): void {
    this.loading = true;
    this.firestore.collection<Beer>('beers', ref => ref
      .where('countryId', '==', countryId)
      .where('brandId', '==', brandId)
      .orderBy('name')
      .startAfter(this.page * this.pageSize)
      .limit(this.pageSize)
    ).valueChanges().subscribe(beers => {
      this.beers = beers;
      this.totalBeers = beers.length;
      this.loading = false;
    });
  }

  currentBeers(): Beer[] {
    const start = this.page * this.pageSize;
    return this.beers.slice(start, start + this.pageSize);
  }

  selectBeer(beerId: string): void {
    this.router.navigate([`/country/${this.route.snapshot.paramMap.get('country')}/brands/${this.route.snapshot.paramMap.get('brandId')}/beers/${beerId}`]);
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadBeers(this.route.snapshot.paramMap.get('country')!, this.route.snapshot.paramMap.get('brandId')!);
    }
  }

  nextPage(): void {
    if (this.page * this.pageSize + this.pageSize < this.totalBeers) {
      this.page++;
      this.loadBeers(this.route.snapshot.paramMap.get('country')!, this.route.snapshot.paramMap.get('brandId')!);
    }
  }

  hasMoreBeers(): boolean {
    return this.page * this.pageSize + this.pageSize < this.totalBeers;
  }
}
