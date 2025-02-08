import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"
import { MatTabsModule } from "@angular/material/tabs"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { MatNativeDateModule } from "@angular/material/core"
import { MatSnackBarModule } from "@angular/material/snack-bar"
import { MatDialogModule } from "@angular/material/dialog"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { MatListModule } from "@angular/material/list"
import { NewBeerRequestComponent } from "./new-beer-request.component"
import { ProfileComponent } from "./profile.component"

@NgModule({
  declarations: [NewBeerRequestComponent, ProfileComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatListModule,
  ],
})
export class ProfileModule {}

