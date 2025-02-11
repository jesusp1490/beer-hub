import { Component, Input } from "@angular/core"
import { UserProfile } from "../../../models/user.model"

interface Challenge {
  id: string
  name: string
  description: string
  progress: number
}

@Component({
  selector: "app-challenges",
  templateUrl: "./challenges.component.html",
  styleUrls: ["./challenges.component.scss"],
})
export class ChallengesComponent {
  @Input() userProfile: UserProfile | null = null

  // Mock data for challenges (replace with real data from a service)
  challenges: Challenge[] = [
    { id: "1", name: "Beer Explorer", description: "Rate 10 different beer styles", progress: 60 },
    { id: "2", name: "World Traveler", description: "Try beers from 5 different countries", progress: 40 },
    { id: "3", name: "Hophead", description: "Rate 5 IPAs", progress: 80 },
  ]
}

