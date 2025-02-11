import { Component, Input } from "@angular/core"
import { UserProfile } from "../../../models/user.model"

@Component({
  selector: "app-challenges",
  templateUrl: "./challenges.component.html",
  styleUrls: ["./challenges.component.scss"],
})
export class ChallengesComponent {
  @Input() userProfile: UserProfile | null = null

  // Implement the component logic here
}

