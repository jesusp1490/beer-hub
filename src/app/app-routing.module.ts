import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CountryListComponent } from './components/country-list/country-list.component';
import { BrandListComponent } from './components/brand-list/brand-list.component';
import { BeerListComponent } from './components/beer-list/beer-list.component';
import { BeerDetailComponent } from './components/beer-detail/beer-detail.component';
import { MapComponent } from './components/map/map.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: CountryListComponent },
  { path: 'brands', component: BrandListComponent },
  { path: 'beers', component: BeerListComponent },
  { path: 'beer/:id', component: BeerDetailComponent },
  { path: 'map', component: MapComponent },
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
