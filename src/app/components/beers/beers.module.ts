import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BeersComponent } from './beers.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BeerDetailsComponent } from '../beer-details/beer-details.component';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { PageLayoutComponent } from '../page-layout/page-layout.component';
import { BackButtonComponent } from '../back-button/back-button.component';

@NgModule({
  declarations: [
    BeersComponent,
    BeerDetailsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SlickCarouselModule,
    RouterModule.forChild([
      { path: '', component: BeersComponent },
      { path: 'country/:country/brands/:brandId/beers/:beerId', component: BeerDetailsComponent }
    ]),
  ],
  exports: [BeersComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class BeersModule { }