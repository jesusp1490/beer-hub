import { Component, Input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatIconModule } from "@angular/material/icon"
import { Achievement } from "../../../models/user.model"

@Component({
  selector: "app-achievement-section",
  templateUrl: "./achievements-section.component.html",
  styleUrls: ["./achievements-section.component.scss"],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
})
export class AchievementSectionComponent {
  @Input() achievements: Achievement[] = []

  convertTimestamp(timestamp: any): Date | null {
    return timestamp ? new Date(timestamp.seconds * 1000) : null
  }
}

