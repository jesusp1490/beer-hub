import { Component, Input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatTabsModule } from "@angular/material/tabs"
import { MatListModule } from "@angular/material/list"
import { MatCardModule } from "@angular/material/card"
import { LeaderboardEntry } from "../../../models/user.model"

@Component({
  selector: "app-leaderboard",
  templateUrl: "./leaderboard.component.html",
  styleUrls: ["./leaderboard.component.scss"],
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatListModule, MatCardModule],
})
export class LeaderboardComponent {
  @Input() globalLeaderboard: LeaderboardEntry[] = []
  @Input() countryLeaderboard: LeaderboardEntry[] = []
}

