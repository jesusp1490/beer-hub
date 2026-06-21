import { Component, OnInit } from "@angular/core"
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
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
import { AuthService } from "../../services/auth.service"

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
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit() {
    this.signUpForm = this.fb.group({
      firstName: ["", Validators.required],
      lastName: ["", Validators.required],
      username: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
      country: ["", Validators.required],
      dob: [null, Validators.required],
    })
  }

  async signUp() {
    this.isLoading = true
    if (this.signUpForm.valid) {
      try {
        const { email, password, firstName, lastName, username, country, dob } = this.signUpForm.value

        await this.authService.signUp(email, password, {
          firstName,
          lastName,
          username,
          country,
          dob: dob ? Timestamp.fromDate(dob) : null,
        })

        this.showSuccessMessage("Sign Up successful! Check your email to verify your account.")
        this.router.navigate(["/dashboard"])
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
