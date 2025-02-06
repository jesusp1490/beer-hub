import { Component, OnInit, OnDestroy } from "@angular/core"
import { Observable, Subject, of } from "rxjs"
import { takeUntil, map, catchError } from "rxjs/operators"
import { AuthService } from "../../services/auth.service"
import { UserService } from "../../services/user.service"
import { BeerService } from "../../services/beer.service"
import { Router } from "@angular/router"
import { MatSnackBar } from "@angular/material/snack-bar"
import { MatDialog } from "@angular/material/dialog"
import { Timestamp } from "@angular/fire/firestore"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { NewBeerRequestComponent } from "./new-beer-request.component"
import { UserProfile, FavoriteBeer, RatedBeer, Achievement, UserRank } from "../../models/user.model"

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit, OnDestroy {
  userProfile$: Observable<UserProfile | null>
  favoriteBeers$: Observable<FavoriteBeer[]>
  ratedBeers$: Observable<RatedBeer[]>
  achievements$: Observable<Achievement[]>
  userRank$: Observable<UserRank | null>
  editForm: FormGroup
  changePasswordForm: FormGroup
  isLoading = false
  isEditMode = false
  isChangePasswordMode = false

  private unsubscribe$ = new Subject<void>()

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private beerService: BeerService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder,
  ) {
    this.userProfile$ = new Observable<UserProfile | null>()
    this.favoriteBeers$ = new Observable<FavoriteBeer[]>()
    this.ratedBeers$ = new Observable<RatedBeer[]>()
    this.achievements$ = new Observable<Achievement[]>()
    this.userRank$ = new Observable<UserRank | null>()
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
    this.authService.user$.pipe(takeUntil(this.unsubscribe$)).subscribe((user) => {
      if (user) {
        console.log("User authenticated:", user.uid)
        this.loadUserData(user.uid)
      } else {
        console.log("No authenticated user")
        this.router.navigate(["/login"])
      }
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private loadUserData(userId: string): void {
    this.userProfile$ = this.userService.getCurrentUserProfile().pipe(
      map((profile) => this.initializeUserProfile(profile)),
      catchError((error) => {
        console.error("Error loading user data:", error)
        return of(null)
      }),
    )
    this.favoriteBeers$ = this.userService.getUserFavoriteBeers()
    this.ratedBeers$ = this.userService.getUserRatedBeers()
    this.achievements$ = this.userService.checkAndUpdateAchievements(userId)
    this.userRank$ = this.userService.updateUserRank(userId)
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
      const { newPassword } = this.changePasswordForm.value
      this.authService
        .updatePassword(newPassword)
        .then(
          () => {
            this.isChangePasswordMode = false
            this.snackBar.open("Password updated successfully!", "Close", { duration: 3000 })
            this.changePasswordForm.reset()
          },
          (error: any) => {
            console.error("Error updating password:", error)
            this.snackBar.open(`Error updating password: ${error.message}`, "Close", { duration: 3000 })
          },
        )
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
          this.authService.user$.pipe(takeUntil(this.unsubscribe$)).subscribe((user) => {
            if (user) {
              this.loadUserData(user.uid)
            }
          })
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

  calculateRankProgress(points: number | undefined, rank: UserRank | null): number {
    if (!points || !rank) return 0
    const progress = ((points - rank.minPoints) / (rank.maxPoints - rank.minPoints)) * 100
    return Math.min(Math.max(progress, 0), 100) // Ensure the value is between 0 and 100
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

  private initializeUserProfile(profile: UserProfile | null): UserProfile {
    const defaultProfile: UserProfile = {
      uid: "",
      email: "",
      displayName: "",
      photoURL: "",
      firstName: "",
      lastName: "",
      username: "",
      country: "",
      dob: null,
      statistics: {
        totalBeersRated: 0,
        countriesExplored: [],
        beerTypeStats: {},
        mostActiveDay: { date: "", count: 0 },
        registrationDate: Timestamp.now(),
        points: 0,
      },
      rank: {
        id: "",
        name: "Novice",
        icon: "🍺",
        minPoints: 0,
        maxPoints: 100,
        level: 1,
      },
      achievements: [],
    }

    if (!profile) {
      return defaultProfile
    }

    return {
      ...defaultProfile,
      ...profile,
      statistics: {
        ...defaultProfile.statistics,
        ...(profile.statistics || {}),
      },
      rank: profile.rank || defaultProfile.rank,
      achievements: profile.achievements || [],
    }
  }
}

