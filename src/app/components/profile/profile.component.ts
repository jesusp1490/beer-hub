import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, } from "@angular/core"
import { Observable, Subject, BehaviorSubject, combineLatest } from "rxjs"
import { takeUntil, map } from "rxjs/operators"
import { AuthService } from "../../services/auth.service"
import { UserService } from "../../services/user.service"
import { BeerService } from "../../services/beer.service"
import { Router } from "@angular/router"
import { MatSnackBar } from "@angular/material/snack-bar"
import { MatDialog } from "@angular/material/dialog"
import { Timestamp } from "@angular/fire/firestore"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { NewBeerRequestComponent } from "./new-beer-request.component"
import { UserProfile, FavoriteBeer, RatedBeer, Achievement, UserRank, Notification } from "../../models/user.model"
import { NotificationService } from "../../services/notification.service"

interface RankDisplay extends UserRank {
  backgroundColor: string
  borderColor: string
  textColor: string
}

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild("rankScroll") rankScroll!: ElementRef<HTMLDivElement>

  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null)
  userProfile$ = this.userProfileSubject.asObservable()
  favoriteBeers$: Observable<FavoriteBeer[]>
  ratedBeers$: Observable<RatedBeer[]>
  achievements$: Observable<Achievement[]>
  userRank$: Observable<UserRank | null> = new Observable<UserRank | null>()
  notifications$: Observable<Notification[]>
  editForm: FormGroup
  changePasswordForm: FormGroup
  isLoading = false
  isEditMode = false
  isChangePasswordMode = false

  private unsubscribe$ = new Subject<void>()

  readonly maxInfinity = Number.POSITIVE_INFINITY
  currentRankPage = 0
  ranksPerPage = 3

  ranks: RankDisplay[] = [
    {
      id: "novice",
      name: "Novice",
      icon: "🍺",
      minPoints: 0,
      maxPoints: 9,
      level: 0,
      backgroundColor: "radial-gradient(circle, #a67c52, #8b4513)",
      borderColor: "#8b4513",
      textColor: "#ffffff",
    },
    {
      id: "beer_recruit",
      name: "Beer Recruit",
      icon: "🏅",
      minPoints: 10,
      maxPoints: 20,
      level: 1,
      backgroundColor: "radial-gradient(circle, #5f9ea0, #2f4f4f)",
      borderColor: "#2f4f4f",
      textColor: "#ffffff",
    },
    {
      id: "hop_private",
      name: "Hop Private",
      icon: "🌿",
      minPoints: 21,
      maxPoints: 50,
      level: 2,
      backgroundColor: "radial-gradient(circle, #228b22, #006400)",
      borderColor: "#006400",
      textColor: "#ffffff",
    },
    {
      id: "malt_corporal",
      name: "Malt Corporal",
      icon: "🌾",
      minPoints: 51,
      maxPoints: 100,
      level: 3,
      backgroundColor: "radial-gradient(circle, #b22222, #8b0000)",
      borderColor: "#8b0000",
      textColor: "#ffffff",
    },
    {
      id: "ale_sergeant",
      name: "Ale Sergeant",
      icon: "🍺",
      minPoints: 101,
      maxPoints: 250,
      level: 4,
      backgroundColor: "radial-gradient(circle, #6a5acd, #4b0082)",
      borderColor: "#4b0082",
      textColor: "#ffffff",
    },
    {
      id: "lager_lieutenant",
      name: "Lager Lieutenant",
      icon: "🍻",
      minPoints: 251,
      maxPoints: 500,
      level: 5,
      backgroundColor: "radial-gradient(circle, #4169e1, #00008b)",
      borderColor: "#00008b",
      textColor: "#ffffff",
    },
    {
      id: "stout_captain",
      name: "Stout Captain",
      icon: "🍺",
      minPoints: 501,
      maxPoints: 750,
      level: 6,
      backgroundColor: "radial-gradient(circle, #708090, #2f4f4f)",
      borderColor: "#2f4f4f",
      textColor: "#ffffff",
    },
    {
      id: "porter_colonel",
      name: "Porter Colonel",
      icon: "🛢️",
      minPoints: 751,
      maxPoints: 1000,
      level: 7,
      backgroundColor: "radial-gradient(circle, #a52a2a, #800000)",
      borderColor: "#800000",
      textColor: "#ffffff",
    },
    {
      id: "imperial_general",
      name: "Imperial General",
      icon: "👑",
      minPoints: 1001,
      maxPoints: 2000,
      level: 8,
      backgroundColor: "radial-gradient(circle, #9932cc, #4a0e4e)",
      borderColor: "#4a0e4e",
      textColor: "#ffffff",
    },
    {
      id: "grand_brewmaster",
      name: "Grand Brewmaster",
      icon: "🏆",
      minPoints: 2001,
      maxPoints: Number.POSITIVE_INFINITY,
      level: 9,
      backgroundColor: "radial-gradient(circle, #ffd700, #daa520)",
      borderColor: "#daa520",
      textColor: "#000000",
    },
  ]

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private beerService: BeerService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {
    this.favoriteBeers$ = new Observable<FavoriteBeer[]>()
    this.ratedBeers$ = new Observable<RatedBeer[]>()
    this.achievements$ = new Observable<Achievement[]>()
    this.notifications$ = this.notificationService.getNotifications()
    this.editForm = this.fb.group({
      firstName: ["", Validators.required],
      lastName: ["", Validators.required],
      username: ["", Validators.required],
      country: [""],
      dob: [null],
    })
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ["", Validators.required],
        newPassword: ["", [Validators.required, Validators.minLength(8)]],
        confirmPassword: ["", Validators.required],
      },
      { validator: this.passwordMatchValidator },
    )
  }

  ngOnInit(): void {
    this.loadUserData()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private loadUserData(): void {
    this.authService.user$.pipe(takeUntil(this.unsubscribe$)).subscribe((user) => {
      if (user) {
        this.userService
          .getCurrentUserProfile()
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe((profile) => {
            if (profile) {
              this.userProfileSubject.next(profile)
              this.userService.updateUserRank(profile.uid).subscribe((rank) => {
                this.userProfileSubject.next({ ...profile, rank })
                this.cdr.detectChanges()
              })
            }
          })

        this.favoriteBeers$ = this.userService.getUserFavoriteBeers()
        this.ratedBeers$ = this.userService.getUserRatedBeers()
        this.achievements$ = this.userService.checkAndUpdateAchievements(user.uid)

        // Combine userProfile$ and userRank$ observables
        this.userRank$ = combineLatest([this.userProfile$, this.userService.updateUserRank(user.uid)]).pipe(
          map(([profile, rank]) => rank || profile?.rank || null),
        )

        // Trigger change detection after all observables are set up
        this.cdr.detectChanges()
      } else {
        this.router.navigate(["/login"])
      }
    })
  }

  addPointsForTesting(): void {
    const userId = "current-user-id" // Replace with actual user ID
    this.userService.addPointsToUser(userId, 100).then(() => {
      this.loadUserData() // Reload user data to trigger rank update
    })
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode
    if (!this.isEditMode) {
      this.resetForm()
    }
  }

  toggleChangePasswordMode(): void {
    this.isChangePasswordMode = !this.isChangePasswordMode
    if (!this.isChangePasswordMode) {
      this.changePasswordForm.reset()
    }
  }

  saveProfile(): void {
    if (this.editForm.valid) {
      this.isLoading = true
      const updatedProfile = {
        ...this.editForm.value,
        dob: this.editForm.value.dob ? Timestamp.fromDate(this.editForm.value.dob) : null,
      }

      this.userService
        .updateUserProfile(updatedProfile)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(
          () => {
            this.isEditMode = false
            this.snackBar.open("Profile updated successfully!", "Close", { duration: 3000 })
          },
          (error: any) => {
            console.error("Error updating profile:", error)
            this.snackBar.open("Error updating profile. Please try again.", "Close", { duration: 3000 })
          },
          () => {
            this.isLoading = false
          },
        )
    }
  }

  changePassword(): void {
    if (this.changePasswordForm.valid) {
      this.isLoading = true
      const { currentPassword, newPassword } = this.changePasswordForm.value
      this.authService
        .changePassword(currentPassword, newPassword)
        .then(() => {
          this.isChangePasswordMode = false
          this.snackBar.open("Password updated successfully!", "Close", { duration: 3000 })
          this.changePasswordForm.reset()
        })
        .catch((error: any) => {
          console.error("Error updating password:", error)
          this.snackBar.open(`Error updating password: ${error.message}`, "Close", { duration: 3000 })
        })
        .finally(() => {
          this.isLoading = false
        })
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      this.isLoading = true
      this.userService
        .uploadProfilePicture(input.files[0])
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(
          () => {
            this.snackBar.open("Profile picture updated successfully!", "Close", { duration: 3000 })
          },
          (error: any) => {
            console.error("Error updating profile picture:", error)
            this.snackBar.open("Error updating profile picture. Please try again.", "Close", { duration: 3000 })
          },
          () => {
            this.isLoading = false
          },
        )
    }
  }

  signOut(): void {
    this.authService.signOut().then(
      () => {
        this.router.navigate(["/login"])
      },
      (error: any) => {
        this.snackBar.open(`Error signing out: ${error.message}`, "Close", { duration: 3000 })
      },
    )
  }

  openNewBeerModal(): void {
    const dialogRef = this.dialog.open(NewBeerRequestComponent, {
      width: "400px",
      panelClass: "custom-dialog-container",
    })

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((result) => {
        if (result) {
          this.beerService.submitNewBeerRequest(result).subscribe(
            () => {
              this.snackBar.open("New beer request submitted!", "Close", { duration: 3000 })
            },
            (error: any) => {
              this.snackBar.open("Error submitting request: " + error, "Close", { duration: 3000 })
            },
          )
        }
      })
  }

  removeFavoriteBeer(beerId: string): void {
    this.userService
      .removeFavoriteBeer(beerId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          this.snackBar.open("Favorite beer removed successfully", "Close", { duration: 3000 })
          this.loadUserData()
        },
        (error: any) => {
          console.error("Error removing favorite beer:", error)
          this.snackBar.open("Error removing favorite beer. Please try again.", "Close", { duration: 3000 })
        },
      )
  }

  removeRating(beerId: string): void {
    this.userService
      .removeUserRating(beerId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          this.snackBar.open("Rating removed successfully", "Close", { duration: 3000 })
          this.loadUserData()
        },
        (error: any) => {
          console.error("Error removing rating:", error)
          this.snackBar.open("Error removing rating. Please try again.", "Close", { duration: 5000 })
        },
      )
  }

  navigateToBeerDetails(beerId: string): void {
    this.router.navigate(["/beers", beerId])
  }

  onViewBeerDetails(beerId: string): void {
    this.navigateToBeerDetails(beerId)
  }

  formatDate(timestamp: Timestamp | null | undefined): string {
    if (timestamp instanceof Timestamp) {
      const date = timestamp.toDate()
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    }
    return "Date not available"
  }

  calculateDaysSinceRegistration(registrationDate: Timestamp | null | undefined): number {
    if (!registrationDate) return 0
    const now = new Date()
    const regDate = registrationDate.toDate()
    const diffTime = Math.abs(now.getTime() - regDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  calculateRankProgress(userProfile: UserProfile | null, rank: UserRank | null): number {
    if (!userProfile || !rank || !userProfile.statistics || userProfile.statistics.points === undefined) return 0
    const points = userProfile.statistics.points
    const progress = ((points - rank.minPoints) / (rank.maxPoints - rank.minPoints)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }

  getRankGradient(rank: UserRank | null): string {
    if (!rank) return "radial-gradient(circle, #4a4a4a, #2a2a2a)"

    const gradients: Record<string, string> = {
      novice: "radial-gradient(circle, #a67c52, #8b4513)",
      "beer recruit": "radial-gradient(circle, #5f9ea0, #2f4f4f)",
      "hop private": "radial-gradient(circle, #228b22, #006400)",
      "malt corporal": "radial-gradient(circle, #b22222, #8b0000)",
      "ale sergeant": "radial-gradient(circle, #6a5acd, #4b0082)",
      "lager lieutenant": "radial-gradient(circle, #4169e1, #00008b)",
      "stout captain": "radial-gradient(circle, #708090, #2f4f4f)",
      "porter colonel": "radial-gradient(circle, #a52a2a, #800000)",
      "imperial general": "radial-gradient(circle, #9932cc, #4a0e4e)",
      "grand brewmaster": "radial-gradient(circle, #ffd700, #daa520)",
    }

    return gradients[rank.name.toLowerCase()] || "radial-gradient(circle, #4a4a4a, #2a2a2a)"
  }

  markNotificationAsRead(id: string): void {
    this.notificationService.markAsRead(id)
  }

  private resetForm(): void {
    this.userProfile$.pipe(takeUntil(this.unsubscribe$)).subscribe((profile) => {
      if (profile) {
        this.editForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          country: profile.country,
          dob: profile.dob ? profile.dob.toDate() : null,
        })
      }
    })
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get("newPassword")
    const confirmPassword = form.get("confirmPassword")
    return newPassword && confirmPassword && newPassword.value === confirmPassword.value
      ? null
      : { passwordMismatch: true }
  }

  getCurrentRankIndex(currentRank: UserRank | null): number {
    if (!currentRank) return 0
    return this.ranks.findIndex((rank) => rank.id === currentRank.id)
  }

  getVisibleRanks(): RankDisplay[] {
    const startIndex = this.currentRankPage * this.ranksPerPage
    return this.ranks.slice(startIndex, startIndex + this.ranksPerPage)
  }

  nextRankPage(): void {
    if ((this.currentRankPage + 1) * this.ranksPerPage < this.ranks.length) {
      this.currentRankPage++
    }
  }

  previousRankPage(): void {
    if (this.currentRankPage > 0) {
      this.currentRankPage--
    }
  }

  canGoToPreviousPage(): boolean {
    return this.currentRankPage > 0
  }

  canGoToNextPage(): boolean {
    return (this.currentRankPage + 1) * this.ranksPerPage < this.ranks.length
  }

  getProfilePictureBorderStyle(rank: UserRank | null): string {
    if (!rank) return "none"
    const rankDisplay = this.ranks.find((r) => r.id === rank.id)
    return rankDisplay ? `4px solid ${rankDisplay.borderColor}` : "none"
  }

  safelyGetNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj)
  }
}

