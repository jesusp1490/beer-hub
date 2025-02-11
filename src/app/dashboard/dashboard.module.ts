import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"
import { MatDialogModule } from "@angular/material/dialog"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatInputModule } from "@angular/material/input"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatCardModule } from "@angular/material/card"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { MatDividerModule } from "@angular/material/divider"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { MatListModule } from "@angular/material/list"
import { DashboardComponent } from "./dashboard.component"
import { EditProfileComponent } from "./components/edit-profile/edit-profile.component"
import { NewBeerRequestComponent } from "./components/new-beer-request/new-beer-request.component"
import { ChangePasswordComponent } from "./components/change-password/change-password.component"
import { LeaderboardComponent } from "./components/leaderboard/leaderboard.component"
import { DashboardRoutingModule } from "../dashboard-routing.module"

@NgModule({
  declarations: [
    DashboardComponent,
    EditProfileComponent,
    NewBeerRequestComponent,
    ChangePasswordComponent,
    LeaderboardComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatProgressBarModule,
    MatListModule,
    DashboardRoutingModule,
  ],
})
export class DashboardModule {}

