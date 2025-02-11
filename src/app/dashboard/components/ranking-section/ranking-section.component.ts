import { Component, Input } from "@angular/core"
import { UserProfile, UserRank } from "../../../models/user.model"

@Component({
  selector: "app-ranking-section",
  templateUrl: "./ranking-section.component.html",
  styleUrls: ["./ranking-section.component.scss"],
})
export class RankingSectionComponent {
  @Input() userProfile: UserProfile | null = null

  get currentRank(): UserRank | undefined {
    return this.userProfile?.rank
  }

  get progressToNextRank(): number {
    if (this.userProfile && this.currentRank) {
      const currentPoints = this.userProfile.statistics?.points || 0
      const rankMinPoints = this.currentRank.minPoints
      const rankMaxPoints = this.currentRank.maxPoints
      return ((currentPoints - rankMinPoints) / (rankMaxPoints - rankMinPoints)) * 100
    }
    return 0
  }
}

