import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import type { Challenge } from "../../../models/challenge.model"

@Component({
  selector: "app-challenges",
  templateUrl: "./challenges.component.html",
  styleUrls: ["./challenges.component.scss"],
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
})
export class ChallengesComponent implements OnInit {
  challenges: Challenge[] = []

  ngOnInit() {
    // TODO: Fetch challenges from a service
    this.challenges = [
      {
        id: "1",
        name: "Sample Challenge",
        description: "This is a sample challenge",
        imageUrl: "path/to/image.jpg",
        reward: 100,
        completed: false,
        progress: 50,
      },
    ]
  }
}

