import { Component } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { MatDialogRef } from "@angular/material/dialog"
import { AuthService } from "../../../services/auth.service"

@Component({
  selector: "app-change-password",
  templateUrl: "./change-password.component.html",
  styleUrls: ["./change-password.component.scss"],
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup

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
      const { currentPassword, newPassword } = this.changePasswordForm.value
      this.authService
        .changePassword(currentPassword, newPassword)
        .then(() => {
          this.dialogRef.close(true)
        })
        .catch((error: any) => {
          console.error("Error changing password:", error)
          // Handle error (e.g., show error message)
        })
    }
  }

  onCancel() {
    this.dialogRef.close()
  }
}

