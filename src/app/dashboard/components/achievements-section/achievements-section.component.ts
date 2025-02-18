import { Component, OnInit, Input } from "@angular/core"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"
import { UserProfile } from "../../../models/user.model"
import { AchievementService } from "../../../services/achievement.service"
import { CombinedAchievement } from "./achievement.interface"
import { MatSelectModule } from "@angular/material/select"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatTooltipModule } from "@angular/material/tooltip"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"

@Component({
  selector: "app-achievements-section",
  templateUrl: "./achievements-section.component.html",
  styleUrls: ["./achievements-section.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatTooltipModule, MatProgressBarModule],
})
export class AchievementsSectionComponent implements OnInit {
  @Input() userProfile!: UserProfile
  combinedAchievements$!: Observable<CombinedAchievement[]>
  selectedCategory = "All"
  showAllAchievements = false

  constructor(
    private achievementService: AchievementService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.combinedAchievements$ = this.achievementService
      .getCombinedAchievements(this.userProfile.uid)
      .pipe(map((achievements) => achievements || []))
  }

  filterAchievements(achievements: CombinedAchievement[] | null): CombinedAchievement[] {
    if (!achievements) return []
    let filteredAchievements = achievements
    if (this.selectedCategory !== "All") {
      filteredAchievements = filteredAchievements.filter((a) => a.category === this.selectedCategory)
    }
    if (!this.showAllAchievements) {
      filteredAchievements = filteredAchievements.filter((a) => a.currentLevel > 0)
    }
    return filteredAchievements
  }

  getCurrentLevelDetails(achievement: CombinedAchievement): { level: number; icon: string; description: string } {
    return achievement.currentLevelDetails || achievement.levels[0]
  }

  getNextLevelDetails(
    achievement: CombinedAchievement,
  ): { level: number; icon: string; description: string; requirement: number } | null {
    const nextLevel = (achievement.currentLevel || 0) + 1
    return achievement.levels.find((l) => l.level === nextLevel) || null
  }

  getIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon)
  }

  calculateProgress(achievement: CombinedAchievement): number {
    const currentLevelRequirement =
      achievement.levels.find((l) => l.level === achievement.currentLevel)?.requirement || 0
    const nextLevelRequirement = this.getNextLevelRequirement(achievement)
    const progress = achievement.progress - currentLevelRequirement
    const total = nextLevelRequirement - currentLevelRequirement
    return total > 0 ? (progress / total) * 100 : 0
  }

  getNextLevelRequirement(achievement: CombinedAchievement): number {
    const nextLevel = (achievement.currentLevel || 0) + 1
    return achievement.levels.find((l) => l.level === nextLevel)?.requirement || 0
  }

  getAchievementDescription(achievement: CombinedAchievement): string {
    return achievement.description || "No description available"
  }

  getAchievementLevelClass(achievement: CombinedAchievement): string {
    const level = achievement.currentLevel || 0
    if (level === 1) return "bronze"
    if (level === 2) return "silver"
    if (level === 3) return "gold"
    return ""
  }

  getProgressText(achievement: CombinedAchievement): string {
    const currentLevel = achievement.currentLevel || 0
    const currentLevelDetails = achievement.levels.find((l) => l.level === currentLevel)
    const nextLevelDetails = this.getNextLevelDetails(achievement)

    if (currentLevelDetails && nextLevelDetails) {
      return `${achievement.progress}/${nextLevelDetails.requirement}`
    }
    return `${achievement.progress}/${currentLevelDetails?.requirement || 0}`
  }

  toggleAllAchievements(): void {
    this.showAllAchievements = !this.showAllAchievements
  }
}

