import { Component, Inject } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog"
import { UserProfile } from "../../../models/user.model"
import { UserService } from "../../../services/user.service"

@Component({
  selector: "app-edit-profile",
  templateUrl: "./edit-profile.component.html",
  styleUrls: ["./edit-profile.component.scss"],
})
export class EditProfileComponent {
  profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private dialogRef: MatDialogRef<EditProfileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserProfile
  ) {
    this.profileForm = this.fb.group({
      displayName: [data.displayName || '', Validators.required],
      firstName: [data.firstName || ''],
      lastName: [data.lastName || ''],
      country: [data.country || ''],
      bio: [data.bio || '']
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.userService.updateUserProfile(this.profileForm.value).subscribe({
        next: () => {
          this.dialogRef.close(true)
        },
        error: (error) => {
          console.error("Error updating profile:", error)
        },
      })
    }
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}

