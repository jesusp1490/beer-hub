import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"

import { DashboardComponent } from "./dashboard.component"
import { ProfileSectionComponent } from "./components/profile-section/profile-section.component"
import { StatisticsComponent } from "./components/statistics/statistics.component"
import { LeaderboardComponent } from "./components/leaderboard/leaderboard.component"
import { ChallengesComponent } from "./components/challenges/challenges.component"
import { AchievementsSectionComponent } from "./components/achievements-section/achievements-section.component"
import { RankingSectionComponent } from "./components/ranking-section/ranking-section.component"
import { ChangePasswordComponent } from "./components/change-password/change-password.component"
import { EditProfileComponent } from "./components/edit-profile/edit-profile.component"
import { NewBeerRequestComponent } from "./components/new-beer-request/new-beer-request.component"

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    DashboardComponent,
    ProfileSectionComponent,
    StatisticsComponent,
    LeaderboardComponent,
    ChallengesComponent,
    AchievementsSectionComponent,
    RankingSectionComponent,
    ChangePasswordComponent,
    EditProfileComponent,
    NewBeerRequestComponent,
  ],
  exports: [DashboardComponent],
})
export class DashboardModule {}

