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
  visibleBeers: Beer[] = [];
  page: number = 0;
  pageSize: number = 5; // Número de cervezas por página
  private countryId: string = '';
  private brandId: string = '';

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router
  ) {
    this.countryId = this.route.snapshot.paramMap.get('country') || '';
    this.brandId = this.route.snapshot.paramMap.get('brandId') || '';
  }

  ngOnInit(): void {
    this.loadBrandData(this.brandId);
    this.loadBeers(this.countryId, this.brandId);
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

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.updateVisibleBeers();
    }
  }

  nextPage(): void {
    if ((this.page + 1) * this.pageSize < this.beers.length) {
      this.page++;
      this.updateVisibleBeers();
    }
  }

  selectBeer(beerId: string): void {
    const route = `/country/${this.countryId}/brands/${this.brandId}/beers/${beerId}`;
    this.router.navigate([route]);
  }

  get hasMoreBeers(): boolean {
    return (this.page + 1) * this.pageSize < this.beers.length;
  }
}
