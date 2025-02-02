import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { MatIconModule } from "@angular/material/icon"
import { BackButtonComponent } from "../components/back-button/back-button.component"
import { PageLayoutComponent } from "../components/page-layout/page-layout.component"

@NgModule({
  declarations: [BackButtonComponent, PageLayoutComponent],
  imports: [CommonModule, RouterModule, MatIconModule],
  exports: [BackButtonComponent, PageLayoutComponent, MatIconModule],
})
export class SharedModule {}

