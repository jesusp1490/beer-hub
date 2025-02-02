import { Component, OnInit, OnDestroy } from "@angular/core"
import { Observable, Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { AuthService } from "../../services/auth.service"
import { UserService } from "../../services/user.service"
import { BeerService } from "../../services/beer.service"
import { Router } from "@angular/router"
import { MatSnackBar } from "@angular/material/snack-bar"
import { MatDialog } from "@angular/material/dialog"
import { Timestamp } from "@angular/fire/firestore"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { NewBeerRequestComponent } from "./new-beer-request.component"
import { UserProfile, FavoriteBeer, RatedBeer } from "../../models/user.model"

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit, OnDestroy {
  userProfile$: Observable<UserProfile | null>
  favoriteBeers$: Observable<FavoriteBeer[]>
  ratedBeers$: Observable<RatedBeer[]>
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

    this.userProfile$ = this.userService.getCurrentUserProfile()
    this.favoriteBeers$ = this.userService.getUserFavoriteBeers()
    this.ratedBeers$ = this.userService.getUserRatedBeers()
  }

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.unsubscribe$)).subscribe((user) => {
      if (user) {
        console.log("User authenticated:", user.uid)
      } else {
        console.log("No authenticated user")
      }
    })

    // Log rated beers for debugging
    this.ratedBeers$.pipe(takeUntil(this.unsubscribe$)).subscribe(
      (ratedBeers) => {
        console.log("Rated beers:", ratedBeers)
      },
      (error) => {
        console.error("Error fetching rated beers:", error)
      },
    )
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
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
        },
        (error: any) => {
          console.error("Error removing rating:", error)
          this.snackBar.open("Error removing rating. Please try again.", "Close", { duration: 3000 })
        },
      )
  }

  navigateToBeerDetails(beerId: string): void {
    this.router.navigate(["/beers", beerId])
  }

  onViewBeerDetails(beerId: string): void {
    this.navigateToBeerDetails(beerId)
  }

  formatDate(timestamp: Timestamp | null): string {
    if (timestamp instanceof Timestamp) {
      const date = timestamp.toDate()
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    }
    return "Date not available"
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
}

