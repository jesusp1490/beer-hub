import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser'; 
import { AppRoutingModule } from './app-routing.module';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ProfileModule } from './components/profile/profile.module'; 

import { CountryListComponent } from './components/country-list/country-list.component';
import { BrandListComponent } from './components/brand-list/brand-list.component';
import { BeerListComponent } from './components/beer-list/beer-list.component';
import { BeerDetailComponent } from './components/beer-detail/beer-detail.component';
import { MapComponent } from './components/map/map.component';
import { FirebaseModule } from './firebase.module';


export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    CountryListComponent,
    BrandListComponent,
    BeerListComponent,
    BeerDetailComponent,
    NavbarComponent,
    MapComponent    
  ],
  imports: [
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AppRoutingModule,
    FirebaseModule,
    RouterModule.forRoot([]),
    FormsModule,
    ProfileModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
