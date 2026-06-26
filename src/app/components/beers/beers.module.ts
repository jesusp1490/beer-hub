import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { SharedModule } from "../../shared/shared.module"
import { BeersComponent } from "./beers.component"
import { BeerDetailsComponent } from "../beer-details/beer-details.component"

@NgModule({
  declarations: [BeersComponent, BeerDetailsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule,
  ],
  exports: [BeersComponent, BeerDetailsComponent],
})
export class BeersModule {}
