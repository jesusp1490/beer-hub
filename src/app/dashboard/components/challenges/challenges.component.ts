import { Component, OnInit, OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { MatIconModule } from "@angular/material/icon"
import { Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { Challenge } from "../../../models/challenge.model"
import { ChallengeService } from "../../../services/challenge.service"

@Component({
  selector: "app-challenges",
  templateUrl: "./challenges.component.html",
  styleUrls: ["./challenges.component.scss"],
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatIconModule],
})
export class ChallengesComponent implements OnInit, OnDestroy {
  challenges: Challenge[] = []
  isLoading = true
  private destroy$ = new Subject<void>()

  constructor(private challengeService: ChallengeService) {}

  ngOnInit() {
    // FIX: previously hardcoded a single fake "Sample Challenge" with a
    // // TODO comment — this now reads real, live challenge progress.
    this.challengeService
      .getActiveChallenges()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (challenges) => {
          this.challenges = challenges
          this.isLoading = false
        },
        error: (error) => {
          console.error("Error loading challenges:", error)
          this.challenges = []
          this.isLoading = false
        },
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  getProgressPercent(challenge: Challenge): number {
    return Math.min(100, (challenge.progress / challenge.threshold) * 100)
  }

  getDaysRemaining(challenge: Challenge): number {
    const msRemaining = challenge.endDate.toMillis() - Date.now()
    return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)))
  }
}
