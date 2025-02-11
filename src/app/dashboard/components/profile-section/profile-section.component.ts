import { Component, Input, OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { MatDialog } from "@angular/material/dialog"
import { UserProfile } from "../../../models/user.model"
import { UserService } from "../../../services/user.service"

@Component({
  selector: "app-profile-section",
  templateUrl: "./profile-section.component.html",
  styleUrls: ["./profile-section.component.scss"],
})
export class ProfileSectionComponent implements OnInit {
  @Input() userProfile: UserProfile | null = null

  editMode = false
  profileForm: FormGroup

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private dialog: MatDialog,
  ) {
    this.profileForm = this.fb.group({
      displayName: ["", [Validators.required]],
      country: ["", [Validators.required]],
      bio: [""],
      dob: ["", [Validators.required]],
    })
  }

  ngOnInit(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        displayName: this.userProfile.displayName,
        country: this.userProfile.country,
        bio: this.userProfile.bio,
        dob: this.userProfile.dob?.toDate(),
      })
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode
    if (!this.editMode) {
      this.resetForm()
    }
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.valid) {
      try {
        await this.userService.updateUserProfile(this.profileForm.value)
        this.editMode = false
      } catch (error) {
        console.error("Error updating profile:", error)
      }
    }
  }

  private resetForm(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        displayName: this.userProfile.displayName,
        country: this.userProfile.country,
        bio: this.userProfile.bio,
        dob: this.userProfile.dob?.toDate(),
      })
    }
  }

  async updateProfilePicture(event: any): Promise<void> {
    const file = event.target.files[0]
    if (file) {
      try {
        const url = await this.userService.uploadProfilePicture(file)
        console.log("Profile picture updated:", url)
      } catch (error) {
        console.error("Error uploading profile picture:", error)
      }
    }
  }
}

