import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { UserService } from "../services/user.service"
import { AuthService } from "../services/auth.service"
import { UserProfile } from "../models/user.model"

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null
  loading = true
  private destroy$ = new Subject<void>()

  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUserProfile()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadUserProfile(): void {
    this.userService
      .getCurrentUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

