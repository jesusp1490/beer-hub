import { Component, Input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatListModule } from "@angular/material/list"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { Challenge } from "../../../models/user.model"

@Component({
  selector: "app-challenges",
  templateUrl: "./challenges.component.html",
  styleUrls: ["./challenges.component.scss"],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatProgressBarModule],
})
export class ChallengesComponent {
  @Input() challenges: Challenge[] = []
}

