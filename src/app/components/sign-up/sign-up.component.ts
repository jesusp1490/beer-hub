import { Component, OnInit } from "@angular/core"
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import { AngularFireAuth } from "@angular/fire/compat/auth"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { CommonModule } from "@angular/common"
import { MatInputModule } from "@angular/material/input"
import { MatButtonModule } from "@angular/material/button"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { MatNativeDateModule } from "@angular/material/core"
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar"
import { MatIconModule } from "@angular/material/icon"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { Router, RouterModule } from "@angular/router"
import { Timestamp } from "@angular/fire/firestore"
import { MatSelectModule } from "@angular/material/select"
import { getNames } from "country-list"

@Component({
  selector: "app-sign-up",
  standalone: true,
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.scss"],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule,
    MatSelectModule,
  ],
})
export class SignUpComponent implements OnInit {
  signUpForm!: FormGroup
  hidePassword = true
  isLoading = false
  countries: string[] = getNames()

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit() {
    this.signUpForm = this.fb.group({
      firstName: ["", Validators.required],
      lastName: ["", Validators.required],
      username: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      country: ["", Validators.required],
      dob: [null, Validators.required],
    })
  }

  async signUp() {
    this.isLoading = true
    if (this.signUpForm.valid) {
      try {
        const { email, password, firstName, lastName, username, country, dob } = this.signUpForm.value
        const result = await this.afAuth.createUserWithEmailAndPassword(email, password)
        const uid = result.user?.uid

        if (uid) {
          const registrationDate = Timestamp.now()
          await this.firestore
            .collection("users")
            .doc(uid)
            .set({
              firstName,
              lastName,
              username,
              country,
              dob: dob ? Timestamp.fromDate(dob) : null,
              email,
              createdAt: registrationDate,
              photoURL: null,
              emailVerified: false,
              rank: { name: "Novice", level: 1, points: 0, progress: 0, pointsToNextRank: 100 },
              achievements: [],
              level: 1,
              progress: 0,
              statistics: {
                totalBeersRated: 0,
                countriesExplored: [],
                beerTypeStats: {},
                registrationDate: registrationDate,
                averageRating: 0,
                favoriteBrewery: "",
                points: 0,
                lastRatingDate: null,
                uniqueStylesCount: 0,
                uniqueCountriesCount: 0,
              },
            })

          this.showSuccessMessage("Sign Up successful!")
          this.router.navigate(["/profile"])
        }
      } catch (error) {
        console.error(`Error: ${(error as any).message}`)
        this.showErrorMessage(`Registration failed: ${(error as any).message}`)
      } finally {
        this.isLoading = false
      }
    } else {
      this.isLoading = false
      this.showErrorMessage("Please fill all required fields correctly.")
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, "Close", {
      duration: 3000,
      panelClass: ["success-snackbar"],
    })
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, "Close", {
      duration: 5000,
      panelClass: ["error-snackbar"],
    })
  }
}

