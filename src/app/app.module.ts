import { NgModule, CUSTOM_ELEMENTS_SCHEMA, ErrorHandler } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { HttpClientModule, HttpClient } from "@angular/common/http"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { RouterModule } from "@angular/router"
import { TranslateModule, TranslateLoader } from "@ngx-translate/core"
import { TranslateHttpLoader } from "@ngx-translate/http-loader"

import { AppRoutingModule } from "./app-routing.module"
import { AppComponent } from "./app.component"
import { SharedModule } from "./shared/shared.module"
import { BeersModule } from "./components/beers/beers.module"
import { ProfileModule } from "./components/profile/profile.module"

// Material Modules
import { MatInputModule } from "@angular/material/input"
import { MatButtonModule } from "@angular/material/button"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { MatNativeDateModule } from "@angular/material/core"
import { MatIconModule } from "@angular/material/icon"
import { MatExpansionModule } from "@angular/material/expansion"
import { MatCheckboxModule } from "@angular/material/checkbox"
import { MatSliderModule } from "@angular/material/slider"

// Firebase Modules
import { AngularFireModule } from "@angular/fire/compat"
import { AngularFireAuthModule } from "@angular/fire/compat/auth"
import { AngularFirestoreModule } from "@angular/fire/compat/firestore"

// Environment
import { environment } from "../environments/environment"

// Components
import { NavbarComponent } from "./components/navbar/navbar.component"
import { HomeComponent } from "./components/home/home.component"
import { MapComponent } from "./components/map/map.component"
import { CountryComponent } from "./components/country/country.component"
import { FilterSearchComponent } from "./components/filters-search/filters-search.component"
import { ForgotPasswordComponent } from "./components/forgot-password/forgot-password.component"
import { LanguageSwitcherComponent } from "./components/language-switcher/language-switcher.component"

// Services
import { AuthService } from "./services/auth.service"
import { RateLimiterService } from "./services/rate-limiter.service"
import { GlobalErrorHandler } from "./services/error-handler.service"

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http)
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    MapComponent,
    CountryComponent,
    FilterSearchComponent,
    ForgotPasswordComponent,
    LanguageSwitcherComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AppRoutingModule,
    SharedModule,
    // BeersModule,
    ProfileModule,
    TranslateModule.forRoot({
      defaultLanguage: "en",
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSliderModule,
  ],
  providers: [AuthService, RateLimiterService, { provide: ErrorHandler, useClass: GlobalErrorHandler }],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}

