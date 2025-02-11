import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule, type Routes } from "@angular/router"
import { ReactiveFormsModule } from "@angular/forms"
import { MatCardModule } from "@angular/material/card"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { MatGridListModule } from "@angular/material/grid-list"
import { MatListModule } from "@angular/material/list"
import { MatTabsModule } from "@angular/material/tabs"
import { MatTableModule } from "@angular/material/table"
import { MatTooltipModule } from "@angular/material/tooltip"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { MatDialogModule } from "@angular/material/dialog"

import { DashboardComponent } from "./dashboard.component"
import { ProfileSectionComponent } from "./components/profile-section/profile-section.component"
import { RankingSectionComponent } from "./components/ranking-section/ranking-section.component"
import { StatisticsComponent } from "./components/statistics/statistics.component"
import { AchievementSectionComponent } from "./components/achievements-section/achievements-section.component"
import { ChallengesComponent } from "./components/challenges/challenges.component"
import { LeaderboardComponent } from "./components/leaderboard/leaderboard.component"

const routes: Routes = [{ path: "", component: DashboardComponent }]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatGridListModule,
    MatListModule,
    MatTabsModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    DashboardComponent,
    ProfileSectionComponent,
    RankingSectionComponent,
    StatisticsComponent,
    AchievementSectionComponent,
    ChallengesComponent,
    LeaderboardComponent,
  ],
  declarations: [],
})
export class DashboardModule {}

