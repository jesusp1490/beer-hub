import { Component, Input, OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { MatExpansionModule } from "@angular/material/expansion"
import { MatIconModule } from "@angular/material/icon"
import { AchievementProgress, UserProfile } from "../../../models/user.model"

@Component({
  selector: "app-achievements-section",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatExpansionModule, MatIconModule],
  templateUrl: "./achievements-section.component.html",
  styleUrls: ["./achievements-section.component.scss"],
})
export class AchievementsSectionComponent implements OnInit {
  @Input() userProfile: UserProfile | null = null

  achievementCategories = [
    { name: "Rating Achievements", icon: "🏆" },
    { name: "Beer Type Achievements", icon: "🍺" },
    { name: "Exploration Achievements", icon: "🌍" },
    { name: "Special Challenges", icon: "🎯" },
  ]

  ngOnInit() {
    // Initialize component
  }

  getAchievementsByCategory(category: string): AchievementProgress[] {
    if (!this.userProfile) return []

    switch (category) {
      case "Rating Achievements":
        return this.userProfile.achievements.filter((a) =>
          [
            "novice_taster",
            "expert_taster",
            "beer_sommelier_master",
            "flavor_explorer",
            "beer_discoverer",
            "beer_critic",
            "master_reviewer",
            "content_creator",
            "beer_influencer",
            "community_legend",
          ].includes(a.id),
        )
      case "Beer Type Achievements":
        return this.userProfile.achievements.filter((a) =>
          [
            "stout_lover",
            "ipa_king",
            "lager_enthusiast",
            "porter_collector",
            "hops_master",
            "sour_adventurer",
            "craft_beer_connoisseur",
            "bock_admirer",
            "barleywine_collector",
            "hazy_ipa_aficionado",
          ].includes(a.id),
        )
      case "Exploration Achievements":
        return this.userProfile.achievements.filter((a) =>
          [
            "beer_explorer",
            "world_beer_tour",
            "european_beer_enthusiast",
            "north_american_beer_fan",
            "south_american_explorer",
            "asian_beer_adventurer",
            "african_beer_master",
            "oceania_beer_enthusiast",
            "high_altitude_beer_drinker",
            "rare_beer_collector",
          ].includes(a.id),
        )
      case "Special Challenges":
        return this.userProfile.achievements.filter((a) =>
          [
            "explorer_of_the_month",
            "ten_ipa_challenge",
            "lager_week",
            "stout_marathon",
            "three_country_challenge",
            "speed_tasting",
            "beer_hunter_pro",
            "brewmaster_challenge",
            "christmas_beer",
            "oktoberfest_challenge",
          ].includes(a.id),
        )
      default:
        return []
    }
  }

  getProgressPercentage(achievement: AchievementProgress): number {
    if (!achievement || !achievement.levels || achievement.levels.length === 0) {
      return 0
    }

    const currentLevel = achievement.levels[achievement.currentLevel - 1]
    const nextLevel = achievement.levels[achievement.currentLevel] || currentLevel

    if (!currentLevel || !nextLevel) {
      return 0
    }

    const currentRequirement = Number(currentLevel.requirement)
    const nextRequirement = Number(nextLevel.requirement)

    if (isNaN(currentRequirement) || isNaN(nextRequirement)) {
      return 0
    }

    const range = nextRequirement - currentRequirement
    const progress = achievement.progress - currentRequirement

    if (range <= 0) {
      return 100
    }

    return Math.min((progress / range) * 100, 100)
  }

  getNextLevelRequirement(achievement: AchievementProgress): number {
    if (!achievement || !achievement.levels || achievement.levels.length === 0) {
      return 0
    }

    const nextLevel = achievement.levels[achievement.currentLevel] || achievement.levels[achievement.levels.length - 1]
    return Number(nextLevel.requirement)
  }
}

