import { Component, type OnInit, Input } from "@angular/core"
import { Observable } from "rxjs"
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

  constructor(
    private achievementService: AchievementService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.combinedAchievements$ = this.achievementService.getCombinedAchievements(this.userProfile.uid)
  }

  filterAchievements(achievements: CombinedAchievement[]): CombinedAchievement[] {
    if (this.selectedCategory === "All") {
      return achievements
    }
    return achievements.filter((a) => a.category === this.selectedCategory)
  }

  getCurrentLevelDetails(achievement: CombinedAchievement): { level: number; icon: string; description: string } {
    return achievement.currentLevelDetails || achievement.levels[0]
  }

  getNextLevelDetails(achievement: CombinedAchievement): { level: number; icon: string; description: string } | null {
    const nextLevel = (achievement.currentLevel || 0) + 1
    return achievement.levels.find((l) => l.level === nextLevel) || null
  }

  getIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon)
  }

  calculateProgress(achievement: CombinedAchievement): number {
    return this.achievementService.getProgressPercentage(achievement)
  }
}

