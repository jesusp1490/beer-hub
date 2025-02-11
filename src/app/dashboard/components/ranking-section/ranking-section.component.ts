import { Component, Input, OnInit } from "@angular/core"
import { UserProfile, UserRank } from "../../../models/user.model"

@Component({
  selector: "app-ranking-section",
  templateUrl: "./ranking-section.component.html",
  styleUrls: ["./ranking-section.component.scss"],
})
export class RankingSectionComponent implements OnInit {
  @Input() userProfile: UserProfile | null = null

  ranks: UserRank[] = [
    { id: "novice", name: "Novice", icon: "🍺", minPoints: 0, maxPoints: 9, level: 0 },
    { id: "beer_recruit", name: "Beer Recruit", icon: "🏅", minPoints: 10, maxPoints: 20, level: 1 },
    { id: "hop_private", name: "Hop Private", icon: "🌿", minPoints: 21, maxPoints: 50, level: 2 },
    { id: "malt_corporal", name: "Malt Corporal", icon: "🌾", minPoints: 51, maxPoints: 100, level: 3 },
    { id: "ale_sergeant", name: "Ale Sergeant", icon: "🍺", minPoints: 101, maxPoints: 250, level: 4 },
    { id: "lager_lieutenant", name: "Lager Lieutenant", icon: "🍻", minPoints: 251, maxPoints: 500, level: 5 },
    { id: "stout_captain", name: "Stout Captain", icon: "🍺", minPoints: 501, maxPoints: 750, level: 6 },
    { id: "porter_colonel", name: "Porter Colonel", icon: "🛢️", minPoints: 751, maxPoints: 1000, level: 7 },
    { id: "imperial_general", name: "Imperial General", icon: "👑", minPoints: 1001, maxPoints: 2000, level: 8 },
    {
      id: "grand_brewmaster",
      name: "Grand Brewmaster",
      icon: "🏆",
      minPoints: 2001,
      maxPoints: Number.POSITIVE_INFINITY,
      level: 9,
    },
  ]

  currentRank: UserRank | undefined
  nextRank: UserRank | undefined
  progressToNextRank = 0

  ngOnInit(): void {
    this.updateRankInfo()
  }

  updateRankInfo(): void {
    if (this.userProfile && this.userProfile.statistics) {
      const userPoints = this.userProfile.statistics.points || 0
      this.currentRank = this.ranks.find((rank) => userPoints >= rank.minPoints && userPoints <= rank.maxPoints)
      this.nextRank = this.ranks.find((rank) => rank.level === (this.currentRank?.level || 0) + 1)

      if (this.currentRank && this.nextRank) {
        const pointsInCurrentRank = userPoints - this.currentRank.minPoints
        const pointsRequiredForNextRank = this.nextRank.minPoints - this.currentRank.minPoints
        this.progressToNextRank = (pointsInCurrentRank / pointsRequiredForNextRank) * 100
      }
    }
  }
}

