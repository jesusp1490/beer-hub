import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { CountryListComponent } from './components/country-list/country-list.component';
import { BrandListComponent } from './components/brand-list/brand-list.component';
import { BeerListComponent } from './components/beer-list/beer-list.component';
import { BeerDetailComponent } from './components/beer-detail/beer-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    CountryListComponent,
    BrandListComponent,
    BeerListComponent,
    BeerDetailComponent
  ],
  imports: [
    BrowserModule,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore())
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
