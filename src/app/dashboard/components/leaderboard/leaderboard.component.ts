import { Component, OnInit } from "@angular/core"
import { UserService } from "../../../services/user.service"
import { LeaderboardEntry } from "../../../models/user.model"

@Component({
  selector: "app-leaderboard",
  templateUrl: "./leaderboard.component.html",
  styleUrls: ["./leaderboard.component.scss"],
})
export class LeaderboardComponent implements OnInit {
  leaderboardEntries: LeaderboardEntry[] = []

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadLeaderboard()
  }

  loadLeaderboard(): void {
    this.userService.getLeaderboard().subscribe(
      (entries: LeaderboardEntry[]) => {
        this.leaderboardEntries = entries
      },
      (error) => {
        console.error("Error loading leaderboard:", error)
      },
    )
  }
}

