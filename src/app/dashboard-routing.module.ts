import { NgModule } from "@angular/core"
import { RouterModule, type Routes } from "@angular/router"
import { DashboardComponent } from "../app/dashboard/dashboard.component"

const routes: Routes = [
  {
    path: "",
    component: DashboardComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}