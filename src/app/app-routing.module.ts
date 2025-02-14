import { NgModule } from "@angular/core"
import { RouterModule, type Routes } from "@angular/router"
import { HomeComponent } from "./components/home/home.component"
import { MapComponent } from "./components/map/map.component"
import { CountryComponent } from "./components/country/country.component"
import { BeersComponent } from "./components/beers/beers.component"
import { BeerDetailsComponent } from "./components/beer-details/beer-details.component"
import { AboutComponent } from "./components/about/about.component"
import { ContactComponent } from "./components/contact/contact.component"
import { SignUpComponent } from "./components/sign-up/sign-up.component"
import { LogInComponent } from "./components/log-in/log-in.component"
import { ForgotPasswordComponent } from "./components/forgot-password/forgot-password.component"
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "map", component: MapComponent },
  { path: "about", component: AboutComponent },
  { path: "contact", component: ContactComponent },
  { path: "beers", component: BeersComponent },
  { path: "beers/:id", component: BeerDetailsComponent },
  { path: "beer/:id", component: BeerDetailsComponent },
  { path: "beers/:beerId", component: BeerDetailsComponent },
  { path: "brands/:brandId/beers", component: BeersComponent },
  { path: "country/:country", component: CountryComponent },
  { path: "country/:country/brands/:brandId", component: BeersComponent },
  { path: "country/:country/brands/:brandId/beers", component: BeersComponent },
  { path: "country/:country/brands/:brandId/beers/:beerId", component: BeerDetailsComponent },
  { path: "signup", component: SignUpComponent },
  { path: "login", component: LogInComponent },
  { path: "forgot-password", component: ForgotPasswordComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: "**", redirectTo: "/home" },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}