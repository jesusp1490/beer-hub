import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapComponent } from './components/map/map.component';
import { CountryComponent } from './components/country/country.component';
import { BeersComponent } from './components/beers/beers.component';
import { BeerDetailsComponent } from './components/beer-details/beer-details.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LogInComponent } from './components/log-in/log-in.component';
import { HomeComponent } from './components/home/home.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent }, // Página de inicio con filtros
  { path: 'map', component: MapComponent }, // Página de mapa
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'beers', component: BeersComponent },
  { path: 'brands/:brandId/beers', component: BeersComponent },
  { path: 'country/:country', component: CountryComponent },
  { path: 'country/:country/brands/:brandId', component: BeersComponent },
  { path: 'country/:country/brands/:brandId/beers', component: BeersComponent },
  { path: 'country/:country/brands/:brandId/beers/:beerId', component: BeerDetailsComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'login', component: LogInComponent },
  { path: '**', redirectTo: '' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
