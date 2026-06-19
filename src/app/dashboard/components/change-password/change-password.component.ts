import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../services/auth.service";

@Component({
  selector: "app-change-password",
  templateUrl: "./change-password.component.html",
  styleUrls: ["./change-password.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule
  ]
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup

  // NEW: previously, a failed password change (wrong current password,
  // network error, etc.) was only logged to the console — the dialog just
  // sat there with no feedback, leaving the user unsure if anything
  // happened. This is bound in the template to show a visible error.
  errorMessage: string | null = null
  isSubmitting = false

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ChangePasswordComponent>,
  ) {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ["", [Validators.required]],
        newPassword: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", [Validators.required]],
      },
      { validator: this.passwordMatchValidator },
    )
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get("newPassword")?.value === g.get("confirmPassword")?.value ? null : { mismatch: true }
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {
      this.errorMessage = null
      this.isSubmitting = true
      const { currentPassword, newPassword } = this.changePasswordForm.value
      this.authService
        .changePassword(currentPassword, newPassword)
        .then(() => {
          this.isSubmitting = false
          this.dialogRef.close(true)
        })
        .catch((error: any) => {
          console.error("Error changing password:", error)
          this.isSubmitting = false
          // FIX: surface a human-readable message instead of failing silently.
          // Firebase's most common failure here is wrong-current-password,
          // surfaced as auth/wrong-password or auth/invalid-credential
          // depending on SDK version — map that to a clear message, and fall
          // back to a generic one for anything else (network errors, etc.).
          if (error?.code === "auth/wrong-password" || error?.code === "auth/invalid-credential") {
            this.errorMessage = "Your current password is incorrect. Please try again."
          } else if (error?.code === "auth/too-many-requests") {
            this.errorMessage = "Too many attempts. Please wait a moment and try again."
          } else {
            this.errorMessage = "Something went wrong while changing your password. Please try again."
          }
        })
    }
  }

  onCancel() {
    this.dialogRef.close()
  }
}