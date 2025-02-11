import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { ReactiveFormsModule } from "@angular/forms"
import { MatCardModule } from "@angular/material/card"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatTabsModule } from "@angular/material/tabs"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { MatDialogModule } from "@angular/material/dialog"
import { MatMenuModule } from "@angular/material/menu"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { MatNativeDateModule } from "@angular/material/core"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { DashboardComponent } from "./dashboard.component"
import { ProfileSectionComponent } from "./components/profile-section/profile-section.component"
import { RankingSectionComponent } from "./components/ranking-section/ranking-section.component"
import { AchievementsSectionComponent } from "./components/achievements-section/achievements-section.component"
import { StatisticsComponent } from "./components/statistics/statistics.component"
import { ChallengesComponent } from "./components/challenges/challenges.component"
import { LeaderboardComponent } from "./components/leaderboard/leaderboard.component"

@NgModule({
  declarations: [
    DashboardComponent,
    ProfileSectionComponent,
    RankingSectionComponent,
    AchievementsSectionComponent,
    StatisticsComponent,
    ChallengesComponent,
    LeaderboardComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: "", component: DashboardComponent }]),
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  exports: [DashboardComponent],
})
export class DashboardModule {}

