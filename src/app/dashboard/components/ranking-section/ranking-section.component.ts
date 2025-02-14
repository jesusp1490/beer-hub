import { Component, Input, OnChanges, SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { MatIconModule } from "@angular/material/icon"
import { UserProfile, UserRank } from "../../../models/user.model"

interface RankInfo {
  name: string
  icon: string
  sublevels: { name: string; minRatings: number; maxRatings: number }[]
}

@Component({
  selector: "app-ranking-section",
  templateUrl: "./ranking-section.component.html",
  styleUrls: ["./ranking-section.component.scss"],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule],
})
export class RankingSectionComponent implements OnChanges {
  @Input() userProfile: UserProfile | null = null
  currentRank: UserRank | null = null
  progress = 0
  remainingXP = 0
  allRanks: RankInfo[] = [
    {
      name: "Beer Recruit",
      icon: "🍺",
      sublevels: [
        { name: "I", minRatings: 0, maxRatings: 20 },
        { name: "II", minRatings: 21, maxRatings: 40 },
        { name: "III", minRatings: 41, maxRatings: 60 },
      ],
    },
    {
      name: "Hop Private",
      icon: "🌿",
      sublevels: [
        { name: "I", minRatings: 61, maxRatings: 100 },
        { name: "II", minRatings: 101, maxRatings: 140 },
        { name: "III", minRatings: 141, maxRatings: 180 },
      ],
    },
    {
      name: "Malt Corporal",
      icon: "🌾",
      sublevels: [
        { name: "I", minRatings: 181, maxRatings: 250 },
        { name: "II", minRatings: 251, maxRatings: 320 },
        { name: "III", minRatings: 321, maxRatings: 400 },
      ],
    },
    {
      name: "Ale Sergeant",
      icon: "🍺",
      sublevels: [
        { name: "I", minRatings: 401, maxRatings: 500 },
        { name: "II", minRatings: 501, maxRatings: 600 },
        { name: "III", minRatings: 601, maxRatings: 700 },
      ],
    },
    {
      name: "Lager Lieutenant",
      icon: "🛢",
      sublevels: [
        { name: "I", minRatings: 701, maxRatings: 850 },
        { name: "II", minRatings: 851, maxRatings: 1000 },
        { name: "III", minRatings: 1001, maxRatings: 1200 },
      ],
    },
    {
      name: "Stout Captain",
      icon: "🍻",
      sublevels: [
        { name: "I", minRatings: 1201, maxRatings: 1400 },
        { name: "II", minRatings: 1401, maxRatings: 1600 },
        { name: "III", minRatings: 1601, maxRatings: 1800 },
      ],
    },
    {
      name: "Porter Colonel",
      icon: "🛢",
      sublevels: [
        { name: "I", minRatings: 1801, maxRatings: 2000 },
        { name: "II", minRatings: 2001, maxRatings: 2200 },
        { name: "III", minRatings: 2201, maxRatings: 2500 },
      ],
    },
    {
      name: "Imperial General",
      icon: "👑",
      sublevels: [
        { name: "I", minRatings: 2501, maxRatings: 2800 },
        { name: "II", minRatings: 2801, maxRatings: 3100 },
        { name: "III", minRatings: 3101, maxRatings: 3500 },
      ],
    },
    {
      name: "Grand Brewmaster",
      icon: "🏆",
      sublevels: [
        { name: "I", minRatings: 3501, maxRatings: 4000 },
        { name: "II", minRatings: 4001, maxRatings: 4500 },
        { name: "III", minRatings: 4501, maxRatings: Number.POSITIVE_INFINITY },
      ],
    },
  ]

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["userProfile"] && this.userProfile) {
      this.currentRank = this.userProfile.rank || null
      this.calculateProgress()
    }
  }

  private calculateProgress(): void {
    if (this.userProfile && this.currentRank) {
      const totalRatings = this.userProfile.statistics?.totalBeersRated || 0
      const currentRankInfo = this.allRanks.find((rank) => rank.name === this.currentRank?.name)

      if (currentRankInfo) {
        const currentSublevel = currentRankInfo.sublevels.find((sublevel) => sublevel.name === this.currentRank?.level)

        if (currentSublevel) {
          const sublevelProgress = totalRatings - currentSublevel.minRatings
          const sublevelTotal = currentSublevel.maxRatings - currentSublevel.minRatings
          this.progress = (sublevelProgress / sublevelTotal) * 100
          this.remainingXP = currentSublevel.maxRatings - totalRatings
        }
      }
    }
  }

  getRankStatus(rank: RankInfo): "locked" | "current" | "unlocked" {
    if (!this.userProfile || !this.currentRank) return "locked"

    const totalRatings = this.userProfile.statistics?.totalBeersRated || 0
    const currentRankIndex = this.allRanks.findIndex((r) => r.name === this.currentRank?.name)
    const rankIndex = this.allRanks.findIndex((r) => r.name === rank.name)

    if (rankIndex < currentRankIndex) return "unlocked"
    if (rankIndex === currentRankIndex) return "current"
    return "locked"
  }
}

