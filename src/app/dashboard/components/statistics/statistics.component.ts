import { Component, Input } from "@angular/core"
import { UserProfile } from "../../../models/user.model"

@Component({
  selector: "app-statistics",
  templateUrl: "./statistics.component.html",
  styleUrls: ["./statistics.component.scss"],
})
export class StatisticsComponent {
  @Input() userProfile: UserProfile | null = null
  @Input() detailed = false

  // Implement the component logic here
}

