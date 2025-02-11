import { Component, Input } from "@angular/core"
import { UserProfile } from "../../../models/user.model"

@Component({
  selector: "app-achievements-section",
  templateUrl: "./achievements-section.component.html",
  styleUrls: ["./achievements-section.component.scss"],
})
export class AchievementsSectionComponent {
  @Input() userProfile: UserProfile | null = null
  @Input() previewMode = false

  // Implement the component logic here
}

