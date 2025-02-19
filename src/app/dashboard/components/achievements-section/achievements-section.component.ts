import { Component, OnInit, Input } from "@angular/core"
import { Observable, BehaviorSubject, combineLatest } from "rxjs"
import { map, tap } from "rxjs/operators"
import { UserProfile } from "../../../models/user.model"
import { AchievementService } from "../../../services/achievement.service"
import { CombinedAchievement } from "./achievement.interface"
import { MatSelectModule } from "@angular/material/select"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatTooltipModule } from "@angular/material/tooltip"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"

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
  filteredAchievements$!: Observable<CombinedAchievement[]>
  showAllAchievements = false
  private showAllSubject = new BehaviorSubject<boolean>(false)
  openedCategories: string[] = ["Rating", "Beer Type", "Exploration"]

  constructor(private achievementService: AchievementService) {}

  ngOnInit(): void {
    console.log("Initializing AchievementsSectionComponent")
    this.combinedAchievements$ = this.achievementService.getCombinedAchievements(this.userProfile.uid).pipe(
      tap((achievements) => {
        console.log("Received achievements:", achievements)
      }),
    )

    this.filteredAchievements$ = combineLatest([this.combinedAchievements$, this.showAllSubject]).pipe(
      map(([achievements, showAll]) => (showAll ? achievements : achievements.filter((a) => a.currentLevel > 0))),
    )

    // Initialize with default value
    this.showAllSubject.next(this.showAllAchievements)
  }

  getCurrentLevelDescription(achievement: CombinedAchievement): string {
    if (achievement.currentLevel === 0) {
      return achievement.description // Show base description for locked achievements
    }
    const currentLevel = achievement.levels.find((l) => l.level === achievement.currentLevel)
    return currentLevel?.description || achievement.description
  }

  getNextLevelDescription(achievement: CombinedAchievement): string {
    if (achievement.completed) {
      return "Maximum level achieved!"
    }

    const nextLevel = achievement.levels.find((l) => l.level === achievement.currentLevel + 1)
    if (!nextLevel) {
      return "Maximum level achieved!"
    }

    return nextLevel.description
  }

  getLevelIcon(level: number): string {
    switch (level) {
      case 1:
        return "🥉"
      case 2:
        return "🥈"
      case 3:
        return "🥇"
      default:
        return ""
    }
  }

  calculateProgress(achievement: CombinedAchievement): number {
    if (achievement.currentLevel === 0) return 0
    if (achievement.completed) return 100

    const currentLevelIndex = achievement.currentLevel - 1
    const currentLevelRequirement = achievement.levels[currentLevelIndex].requirement
    const nextLevelRequirement = achievement.levels[currentLevelIndex + 1]?.requirement || currentLevelRequirement

    const progressInLevel = achievement.progress - currentLevelRequirement
    const levelRange = nextLevelRequirement - currentLevelRequirement

    return Math.min(100, (progressInLevel / levelRange) * 100)
  }

  getProgressText(achievement: CombinedAchievement): string {
    if (achievement.currentLevel === 0) {
      return `0/${achievement.levels[0].requirement}`
    }

    const currentLevelIndex = achievement.currentLevel - 1
    const nextLevelRequirement = achievement.levels[currentLevelIndex + 1]?.requirement

    if (!nextLevelRequirement) {
      return "Max Level"
    }

    return `${achievement.progress}/${nextLevelRequirement}`
  }

  toggleAllAchievements(): void {
    this.showAllAchievements = !this.showAllAchievements
    console.log("Toggling achievements visibility:", this.showAllAchievements)
    this.showAllSubject.next(this.showAllAchievements)
  }

  toggleCategory(category: string): void {
    const index = this.openedCategories.indexOf(category)
    if (index > -1) {
      this.openedCategories.splice(index, 1)
    } else {
      this.openedCategories.push(category)
    }
  }

  filterAchievementsByCategory(achievements: CombinedAchievement[], category: string): CombinedAchievement[] {
    return achievements.filter((a) => a.category === category)
  }
}

