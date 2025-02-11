import { Component, Input } from "@angular/core"
import { UserProfile, Achievement } from "../../../models/user.model"

@Component({
  selector: "app-achievements-section",
  templateUrl: "./achievements-section.component.html",
  styleUrls: ["./achievements-section.component.scss"],
})
export class AchievementsSectionComponent {
  @Input() userProfile: UserProfile | null = null

  get recentAchievements(): Achievement[] {
    return this.userProfile?.achievements?.slice(0, 3) || []
  }
}

