import { Component, Input, type SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import type { UserProfile, UserRank } from "../../../models/user.model"

@Component({
  selector: "app-ranking-section",
  templateUrl: "./ranking-section.component.html",
  styleUrls: ["./ranking-section.component.scss"],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule],
})
export class RankingSectionComponent {
  @Input() userProfile: UserProfile | null = null
  currentRank: UserRank | null = null
  progress = 0

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["userProfile"] && this.userProfile) {
      this.currentRank = this.userProfile.rank || null
      this.calculateProgress()
    }
  }

  private calculateProgress(): void {
    if (this.userProfile && this.currentRank) {
      const userPoints = this.userProfile.statistics?.points || 0
      const rankMinPoints = this.currentRank.points
      const rankMaxPoints = this.getNextRankPoints()
      this.progress = ((userPoints - rankMinPoints) / (rankMaxPoints - rankMinPoints)) * 100
    }
  }

  public getNextRankPoints(): number {
    // Implement logic to get the points required for the next rank
    // This is a placeholder implementation
    return this.currentRank ? this.currentRank.points + 100 : 100
  }
}

