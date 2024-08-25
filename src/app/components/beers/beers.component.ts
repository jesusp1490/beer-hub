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
  page: number = 0;
  pageSize: number = 5;
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const countryId = params.get('country');
      const brandId = params.get('brandId');
      console.log('Route Parameters:', params.keys);
      console.log('Country ID:', countryId);
      console.log('Brand ID:', brandId);

      if (countryId && brandId) {
        this.loading = true;
        this.loadBrandData(brandId);
        this.loadBeers(countryId, brandId);
      } else {
        console.error('Country ID or Brand ID is missing.');
      }
    });
  }


  private loadBrandData(brandId: string): void {
    this.firestore.collection<Brand>('brands').doc(brandId).valueChanges().subscribe(brand => {
      if (brand) {
        this.brandName = brand.name;
        console.log('Brand data loaded:', brand);
      } else {
        console.error('Brand not found');
      }
    });
  }

  private loadBeers(countryId: string, brandId: string): void {
    this.firestore.collection<Beer>('beers', ref => ref
      .where('countryId', '==', countryId)
      .where('brandId', '==', brandId)
      .orderBy('name')
      .limit(this.pageSize)
    ).valueChanges().subscribe(beers => {
      this.beers = beers;
      this.loading = false;
    });
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
    this.page++;
    this.loadBeers(this.route.snapshot.paramMap.get('country')!, this.route.snapshot.paramMap.get('brandId')!);
  }
}
