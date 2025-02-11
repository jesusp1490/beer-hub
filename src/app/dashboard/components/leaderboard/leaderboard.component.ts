import { Component, OnInit } from "@angular/core"
import { UserService } from "../../../services/user.service"
import { UserProfile } from "../../../models/user.model"

@Component({
  selector: "app-leaderboard",
  templateUrl: "./leaderboard.component.html",
  styleUrls: ["./leaderboard.component.scss"],
})
export class LeaderboardComponent implements OnInit {
  leaderboard: UserProfile[] = []

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadLeaderboard()
  }

  private loadLeaderboard(): void {
    this.userService.getLeaderboard().subscribe({
      next: (users) => {
        this.leaderboard = users
      },
      error: (error) => console.error("Error loading leaderboard:", error),
    })
  }
}

