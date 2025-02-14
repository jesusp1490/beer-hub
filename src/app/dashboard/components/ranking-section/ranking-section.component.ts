import { Component, Input, OnChanges, SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { MatExpansionModule } from "@angular/material/expansion"
import { UserProfile, UserRank } from "../../../models/user.model"

interface RankInfo {
  name: string
  icon: string
  levels: Array<{
    name: string
    minXP: number
    maxXP: number
  }>
}

@Component({
  selector: "app-ranking-section",
  templateUrl: "./ranking-section.component.html",
  styleUrls: ["./ranking-section.component.scss"],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatExpansionModule],
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
      levels: [
        { name: "I", minXP: 0, maxXP: 19 },
        { name: "II", minXP: 20, maxXP: 39 },
        { name: "III", minXP: 40, maxXP: 59 },
      ],
    },
    {
      name: "Hop Private",
      icon: "🌿",
      levels: [
        { name: "I", minXP: 60, maxXP: 99 },
        { name: "II", minXP: 100, maxXP: 139 },
        { name: "III", minXP: 140, maxXP: 179 },
      ],
    },
    {
      name: "Malt Corporal",
      icon: "🌾",
      levels: [
        { name: "I", minXP: 180, maxXP: 259 },
        { name: "II", minXP: 260, maxXP: 339 },
        { name: "III", minXP: 340, maxXP: 399 },
      ],
    },
    {
      name: "Ale Sergeant",
      icon: "🍺",
      levels: [
        { name: "I", minXP: 400, maxXP: 519 },
        { name: "II", minXP: 520, maxXP: 639 },
        { name: "III", minXP: 640, maxXP: 699 },
      ],
    },
    {
      name: "Lager Lieutenant",
      icon: "🍻",
      levels: [
        { name: "I", minXP: 700, maxXP: 899 },
        { name: "II", minXP: 900, maxXP: 1099 },
        { name: "III", minXP: 1100, maxXP: 1199 },
      ],
    },
    {
      name: "Stout Captain",
      icon: "🍻",
      levels: [
        { name: "I", minXP: 1200, maxXP: 1499 },
        { name: "II", minXP: 1500, maxXP: 1699 },
        { name: "III", minXP: 1700, maxXP: 1799 },
      ],
    },
    {
      name: "Porter Colonel",
      icon: "🏆",
      levels: [
        { name: "I", minXP: 1800, maxXP: 2099 },
        { name: "II", minXP: 2100, maxXP: 2299 },
        { name: "III", minXP: 2300, maxXP: 2499 },
      ],
    },
    {
      name: "Imperial General",
      icon: "👑",
      levels: [
        { name: "I", minXP: 2500, maxXP: 2899 },
        { name: "II", minXP: 2900, maxXP: 3199 },
        { name: "III", minXP: 3200, maxXP: 3499 },
      ],
    },
    {
      name: "Grand Brewmaster",
      icon: "🏆",
      levels: [{ name: "I", minXP: 3500, maxXP: Number.POSITIVE_INFINITY }],
    },
  ]

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["userProfile"] && this.userProfile) {
      this.currentRank = this.userProfile.rank || null
      this.calculateProgress()
    }
  }

  private calculateProgress(): void {
    if (this.userProfile?.statistics && this.currentRank) {
      const points = this.userProfile.statistics.points || 0
      const currentRankInfo = this.getCurrentRankInfo()

      if (currentRankInfo) {
        const currentLevel = currentRankInfo.levels.find((level) => level.name === this.currentRank?.level)

        if (currentLevel) {
          const levelProgress = points - currentLevel.minXP
          const levelTotal = currentLevel.maxXP - currentLevel.minXP
          this.progress = Math.min((levelProgress / levelTotal) * 100, 100)
          this.remainingXP = Math.max(currentLevel.maxXP - points, 0)
        }
      }
    }
  }

  private getCurrentRankInfo(): RankInfo | undefined {
    return this.allRanks.find((r) => r.name === this.currentRank?.name)
  }

  getRankStatus(rank: RankInfo): "locked" | "current" | "unlocked" {
    if (!this.userProfile?.statistics || !this.currentRank) return "locked"

    const points = this.userProfile.statistics.points || 0
    const currentRankIndex = this.allRanks.findIndex((r) => r.name === this.currentRank?.name)
    const rankIndex = this.allRanks.findIndex((r) => r.name === rank.name)

    if (rankIndex < currentRankIndex) return "unlocked"
    if (rankIndex === currentRankIndex) return "current"
    return "locked"
  }

  isCurrentLevel(rankName: string, level: string): boolean {
    if (!this.currentRank) return false
    return this.currentRank.name === rankName && this.currentRank.level === level
  }
}

