import { Component, OnInit } from "@angular/core"
import { UserService } from "../services/user.service"
import { UserProfile } from "../models/user.model"

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
  userProfile: UserProfile | null = null
  loading = true

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUserProfile()
  }

  private loadUserProfile(): void {
    this.userService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile
        this.loading = false
      },
      error: (error) => {
        console.error("Error loading user profile:", error)
        this.loading = false
      },
    })
  }
}

