import { NgModule, CUSTOM_ELEMENTS_SCHEMA, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { AppRoutingModule } from './app-routing.module';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { ProfileModule } from './components/profile/profile.module';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MapComponent } from './components/map/map.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LogInComponent } from './components/log-in/log-in.component';
import { AuthService } from './services/auth.service';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { CountryComponent } from './components/country/country.component';
import { CommonModule } from '@angular/common';
import { BeersModule } from './components/beers/beers.module'; 
import { FilterSearchComponent } from './components/filters-search/filters-search.component';
import { BackButtonComponent } from './components/back-button/back-button.component';
import { PageLayoutComponent } from './components/page-layout/page-layout.component';
import { GlobalErrorHandler } from './services/error-handler.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MapComponent,
    CountryComponent,
    FilterSearchComponent,
    BackButtonComponent,
    PageLayoutComponent,
    HomeComponent,
    // AboutComponent,
    // ContactComponent,
    // SignUpComponent,
    // LogInComponent,
    ForgotPasswordComponent,
    LanguageSwitcherComponent,
  ],
  imports: [
    BrowserModule,
    BeersModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ProfileModule,
    CommonModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSliderModule,
  ],
  exports: [
    BackButtonComponent
  ],
  providers: [
    AuthService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] 
})
export class AppModule { }

